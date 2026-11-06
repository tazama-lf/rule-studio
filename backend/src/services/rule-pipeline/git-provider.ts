import { Logger } from '@nestjs/common';
import type { GitProfile } from './artifact-profile';

export interface GitFile {
  path: string;
  content: string;
}

export interface GitProvider {
  ensureRepo: (name: string) => Promise<{ created: boolean; url: string }>;
  pushFiles: (repo: string, files: GitFile[], message: string) => Promise<void>;
}

export function createGitProvider(profile: GitProfile): GitProvider | undefined {
  return profile.kind === 'none' ? undefined : new RestGitProvider(profile);
}

interface RepoResponse {
  html_url: string;
  default_branch: string;
}

class RestGitProvider implements GitProvider {
  private readonly logger = new Logger(RestGitProvider.name);
  private readonly api: string;

  constructor(private readonly profile: GitProfile) {
    this.api = profile.kind === 'gitea' ? `${profile.apiUrl}/api/v1` : profile.apiUrl;
  }

  private async request(method: string, path: string, body?: unknown): Promise<Response> {
    const headers: Record<string, string> = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
    if (this.profile.token) {
      headers.Authorization = this.profile.kind === 'gitea' ? `token ${this.profile.token}` : `Bearer ${this.profile.token}`;
    }
    return await fetch(`${this.api}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  }

  private async fail(res: Response, action: string): Promise<never> {
    throw new Error(`${this.profile.kind} ${action} failed: HTTP ${res.status} ${await res.text()}`);
  }

  async ensureRepo(name: string): Promise<{ created: boolean; url: string }> {
    const { owner, branch } = this.profile;
    const existing = await this.request('GET', `/repos/${owner}/${name}`);
    if (existing.ok) {
      const repo = (await existing.json()) as RepoResponse;
      return { created: false, url: repo.html_url };
    }
    if (existing.status !== 404) await this.fail(existing, `lookup of ${owner}/${name}`);

    const res = await this.request('POST', `/orgs/${owner}/repos`, { name, private: false, auto_init: true, default_branch: branch });
    if (!res.ok) await this.fail(res, `creation of ${owner}/${name}`);
    const repo = (await res.json()) as RepoResponse;

    if (repo.default_branch !== branch) {
      const head = await this.request('GET', `/repos/${owner}/${name}/git/ref/heads/${repo.default_branch}`);
      if (!head.ok) await this.fail(head, `read of ${repo.default_branch}`);
      const { object } = (await head.json()) as { object: { sha: string } };
      const ref = await this.request('POST', `/repos/${owner}/${name}/git/refs`, { ref: `refs/heads/${branch}`, sha: object.sha });
      if (!ref.ok) await this.fail(ref, `creation of branch ${branch}`);
    }

    this.logger.log(`Created repository ${owner}/${name} on branch ${branch}`);
    return { created: true, url: repo.html_url };
  }

  async pushFiles(repo: string, files: GitFile[], message: string): Promise<void> {
    const { owner, branch, kind } = this.profile;
    /* eslint-disable no-await-in-loop -- commits on one branch must be sequential */
    for (const file of files) {
      const path = `/repos/${owner}/${repo}/contents/${file.path}`;
      const current = await this.request('GET', `${path}?ref=${branch}`);
      if (!current.ok && current.status !== 404) await this.fail(current, `read of ${file.path}`);
      const sha = current.ok ? ((await current.json()) as { sha: string }).sha : undefined;

      const body = { message, branch, sha, content: Buffer.from(file.content).toString('base64') };
      const method = kind === 'gitea' && !sha ? 'POST' : 'PUT';
      const res = await this.request(method, path, body);
      if (!res.ok) await this.fail(res, `write of ${file.path}`);
    }
    /* eslint-enable no-await-in-loop */
  }
}
