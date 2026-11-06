import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { GitProfile } from '../../src/services/rule-pipeline/artifact-profile';
import { createGitProvider } from '../../src/services/rule-pipeline/git-provider';

const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch as typeof fetch;

const gitea: GitProfile = { kind: 'gitea', apiUrl: 'http://gitea:3000', owner: 'tazama-rules', token: 'tok', branch: 'staging' };
const github: GitProfile = { kind: 'github', apiUrl: 'https://api.github.com', owner: 'acme', token: 'tok', branch: 'staging' };

function reply(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), { status });
}

function route(routes: Array<[string, Response]>): void {
  mockFetch.mockImplementation(async (url, init) => {
    const key = `${init?.method ?? 'GET'} ${String(url)}`;
    const match = routes.find(([prefix]) => key.startsWith(prefix));
    if (!match) throw new Error(`unexpected request ${key}`);
    return match[1].clone();
  });
}

function calls(): Array<{ key: string; body?: Record<string, unknown>; auth?: string }> {
  return mockFetch.mock.calls.map(([url, init]) => ({
    key: `${init?.method} ${String(url)}`,
    body: init?.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : undefined,
    auth: (init?.headers as Record<string, string>).Authorization,
  }));
}

describe('createGitProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns no provider when git is switched off', () => {
    expect(createGitProvider({ ...gitea, kind: 'none' })).toBeUndefined();
  });

  describe('gitea', () => {
    it('reuses an existing repository', async () => {
      route([['GET http://gitea:3000/api/v1/repos/tazama-rules/rule-903', reply(200, { html_url: 'http://gitea/r', default_branch: 'staging' })]]);

      await expect(createGitProvider(gitea)!.ensureRepo('rule-903')).resolves.toEqual({ created: false, url: 'http://gitea/r' });
      expect(calls()).toHaveLength(1);
      expect(calls()[0].auth).toBe('token tok');
    });

    it('creates a missing repository with the profile branch as default', async () => {
      route([
        ['GET http://gitea:3000/api/v1/repos/tazama-rules/rule-903', reply(404)],
        ['POST http://gitea:3000/api/v1/orgs/tazama-rules/repos', reply(201, { html_url: 'http://gitea/r', default_branch: 'staging' })],
      ]);

      await expect(createGitProvider(gitea)!.ensureRepo('rule-903')).resolves.toEqual({ created: true, url: 'http://gitea/r' });
      expect(calls()[1].body).toEqual({ name: 'rule-903', private: false, auto_init: true, default_branch: 'staging' });
    });

    it('creates new files with POST and updates existing ones with PUT and their sha', async () => {
      const contents = 'http://gitea:3000/api/v1/repos/tazama-rules/rule-903/contents';
      route([
        [`GET ${contents}/src/rule.ts`, reply(200, { sha: 'abc' })],
        [`GET ${contents}/__tests__/unit/rule.test.ts`, reply(404)],
        [`PUT ${contents}/src/rule.ts`, reply(200)],
        [`POST ${contents}/__tests__/unit/rule.test.ts`, reply(201)],
      ]);

      await createGitProvider(gitea)!.pushFiles(
        'rule-903',
        [
          { path: 'src/rule.ts', content: 'rule' },
          { path: '__tests__/unit/rule.test.ts', content: 'test' },
        ],
        'sync',
      );

      const writes = calls().filter((c) => !c.key.startsWith('GET'));
      expect(writes.map((c) => c.key)).toEqual([`PUT ${contents}/src/rule.ts`, `POST ${contents}/__tests__/unit/rule.test.ts`]);
      expect(writes[0].body).toEqual({ message: 'sync', branch: 'staging', sha: 'abc', content: Buffer.from('rule').toString('base64') });
      expect(writes[1].body).toEqual({ message: 'sync', branch: 'staging', content: Buffer.from('test').toString('base64') });
    });

    it('reports the server response when a call fails', async () => {
      route([['GET http://gitea:3000/api/v1/repos/tazama-rules/rule-903', reply(500, { message: 'boom' })]]);

      await expect(createGitProvider(gitea)!.ensureRepo('rule-903')).rejects.toThrow('gitea lookup of tazama-rules/rule-903 failed: HTTP 500');
    });
  });

  describe('github', () => {
    it('creates a missing repository and branches the profile branch off the initial commit', async () => {
      route([
        ['GET https://api.github.com/repos/acme/rule-903/git/ref/heads/main', reply(200, { object: { sha: 'init' } })],
        ['GET https://api.github.com/repos/acme/rule-903', reply(404)],
        ['POST https://api.github.com/orgs/acme/repos', reply(201, { html_url: 'https://github.com/acme/rule-903', default_branch: 'main' })],
        ['POST https://api.github.com/repos/acme/rule-903/git/refs', reply(201)],
      ]);

      await expect(createGitProvider(github)!.ensureRepo('rule-903')).resolves.toEqual({
        created: true,
        url: 'https://github.com/acme/rule-903',
      });
      expect(calls().at(-1)).toMatchObject({
        key: 'POST https://api.github.com/repos/acme/rule-903/git/refs',
        body: { ref: 'refs/heads/staging', sha: 'init' },
        auth: 'Bearer tok',
      });
    });

    it('uses PUT for new files', async () => {
      const contents = 'https://api.github.com/repos/acme/rule-903/contents/src/rule.ts';
      route([
        [`GET ${contents}`, reply(404)],
        [`PUT ${contents}`, reply(201)],
      ]);

      await createGitProvider(github)!.pushFiles('rule-903', [{ path: 'src/rule.ts', content: 'rule' }], 'sync');

      expect(calls().map((c) => c.key)).toEqual([`GET ${contents}?ref=staging`, `PUT ${contents}`]);
    });
  });
});
