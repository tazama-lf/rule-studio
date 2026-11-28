import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { NpmProfile } from './artifact-profile';

export interface RuleSource {
  ruleId: string;
  version: string;
  ruleCode: string;
  testCode: string;
  tenantId?: string;
}

const RULE_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const TEMPLATE_SKIP = new Set(['node_modules', '.git', '.github', '.husky', 'coverage', 'reports', 'lib', 'build']);
const EXECUTER_FILES = ['src', 'package.json', 'package-lock.json', 'tsconfig.json'];

interface LockEntry {
  version?: string;
  resolved?: string;
  integrity?: string;
  link?: boolean;
  inBundle?: boolean;
}

export function assertValidRuleSource(source: RuleSource): void {
  if (source.ruleId.length > 64 || !RULE_ID.test(source.ruleId)) {
    throw new Error(`Invalid rule id '${source.ruleId}': use lowercase letters and digits, optionally separated by '.', '_' or '-'`);
  }
  if (source.version.length > 128 || !VERSION.test(source.version)) {
    throw new Error(`Invalid rule version '${source.version}': expected semver such as 1.0.0 or 1.0.0-rc.1`);
  }
}

export function prepareWorkspace(source: RuleSource, templateDir: string, workDir: string, npm: NpmProfile): void {
  cpSync(templateDir, workDir, { recursive: true, filter: (src) => !TEMPLATE_SKIP.has(relative(templateDir, src)) });
  mkdirSync(join(workDir, '__tests__', 'unit'), { recursive: true });
  writeFileSync(join(workDir, 'src', 'rule.ts'), source.ruleCode);
  writeFileSync(join(workDir, '__tests__', 'unit', 'rule.test.ts'), source.testCode);

  const pkgPath = join(workDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> } & Record<string, unknown>;
  pkg.name = `@tazama-lf/rule-${source.ruleId}`;
  pkg.version = source.version;
  delete pkg.scripts?.prepare;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  configureNpm(workDir, npm, 'rule template');
}

export function prepareExecuter(executerDir: string, execDir: string, npm: NpmProfile): void {
  for (const entry of EXECUTER_FILES) cpSync(join(executerDir, entry), join(execDir, entry), { recursive: true });
  configureNpm(execDir, npm, 'rule-executer');
}

export const CACHE_REGISTRIES_FILE = 'registries.npmrc';

export function npmrc(npm: NpmProfile): string {
  if (npm.source === 'offline') {
    const recorded = npm.cacheDir ? join(npm.cacheDir, CACHE_REGISTRIES_FILE) : '';
    const registries = recorded && existsSync(recorded) ? readFileSync(recorded, 'utf8') : '';
    return `${registries}offline=true\n`;
  }
  const lines = [`registry=${npm.url}/`, ...npm.scopes.map((scope) => `${scope}:registry=${npm.scopeUrl}/`)];
  if (npm.token) lines.push(`${npm.scopeUrl.replace(/^https?:/, '')}/:_authToken=\${NPM_TOKEN}`);
  return `${lines.join('\n')}\n`;
}

export function assertLockfileIntegrity(packages: Record<string, LockEntry>, owner: string): void {
  const missing = Object.entries(packages)
    .filter(([path, entry]) => path !== '' && !entry.link && !entry.inBundle && !entry.resolved?.startsWith('file:') && !entry.integrity)
    .map(([path]) => path.replace(/^.*node_modules\//, ''));
  if (missing.length > 0) {
    throw new Error(`The ${owner} lockfile has no integrity hash for ${missing.length} package(s): ${missing.slice(0, 5).join(', ')}`);
  }
}

function configureNpm(dir: string, npm: NpmProfile, owner: string): void {
  writeFileSync(join(dir, '.npmrc'), npmrc(npm));

  const lockPath = join(dir, 'package-lock.json');
  const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as { packages?: Record<string, LockEntry> };
  assertLockfileIntegrity(lock.packages ?? {}, owner);
  if (npm.source === 'offline') return;
  for (const entry of Object.values(lock.packages ?? {})) {
    if (!entry.resolved?.startsWith('file:')) delete entry.resolved;
  }
  writeFileSync(lockPath, JSON.stringify(lock, null, 2));
}
