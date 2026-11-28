import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const GITHUB_REPO = 'tazama-lf/Full-Stack-Docker-Tazama';
const REPO_BRANCH = process.env.TAZAMA_REPO_BRANCH ?? 'dev';

export interface SqlMigrations {
  baseSqlContents: Array<{ content: string; target: string }>;
  publicBaseSql: string;
  dockerhubSql: string;
}

interface GithubEntry {
  type: string;
  name: string;
  download_url: string;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return await res.text();
}

async function listGithubDir(dirPath: string): Promise<GithubEntry[]> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${dirPath}?ref=${REPO_BRANCH}`;
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
  const entries = (await res.json()) as GithubEntry[];
  return entries.filter((e) => e.type === 'file');
}

async function fetchGithubSql(log: (message: string) => void): Promise<SqlMigrations> {
  log('Fetching SQL migration files from GitHub...');

  const baseSqlEntries = await listGithubDir('core/postgres/migration/base');
  log(`Fetched ${baseSqlEntries.length} base SQL entries from GitHub`);
  const baseSqlContents = await Promise.all(
    baseSqlEntries.map(async (entry) => ({
      content: await fetchText(entry.download_url),
      target: `/docker-entrypoint-initdb.d/${entry.name}`,
    })),
  );
  log(`Downloaded ${baseSqlContents.length} base SQL files`);

  const [publicBaseSql, dockerhubSql] = await Promise.all([
    fetchText(`https://raw.githubusercontent.com/${GITHUB_REPO}/${REPO_BRANCH}/core/postgres/migration/config/00-public-base.sql`),
    fetchText(`https://raw.githubusercontent.com/${GITHUB_REPO}/${REPO_BRANCH}/core/postgres/migration/config/02-public-dockerhub.sql`),
  ]);
  log(`Downloaded config SQL files (public-base: ${publicBaseSql.length} chars, dockerhub: ${dockerhubSql.length} chars)`);
  return { baseSqlContents, publicBaseSql, dockerhubSql };
}

function readLocalSql(dir: string, log: (message: string) => void): SqlMigrations {
  const baseDir = join(dir, 'base');
  const baseSqlContents = readdirSync(baseDir)
    .sort()
    .map((file) => ({ content: readFileSync(join(baseDir, file), 'utf8'), target: `/docker-entrypoint-initdb.d/${file}` }));
  log(`Read ${baseSqlContents.length} base SQL files from ${baseDir}`);
  return {
    baseSqlContents,
    publicBaseSql: readFileSync(join(dir, 'config', '00-public-base.sql'), 'utf8'),
    dockerhubSql: readFileSync(join(dir, 'config', '02-public-dockerhub.sql'), 'utf8'),
  };
}

export async function loadSqlMigrations(log: (message: string) => void): Promise<SqlMigrations> {
  const localDir = process.env.TAZAMA_SQL_DIR;
  return localDir ? readLocalSql(localDir, log) : await fetchGithubSql(log);
}
