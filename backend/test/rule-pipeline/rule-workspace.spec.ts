import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { NpmProfile } from '../../src/services/rule-pipeline/artifact-profile';
import {
  assertLockfileIntegrity,
  assertValidRuleSource,
  npmrc,
  prepareExecuter,
  prepareWorkspace,
  type RuleSource,
} from '../../src/services/rule-pipeline/rule-workspace';

const source: RuleSource = { ruleId: '903', version: '1.0.0', ruleCode: 'export const rule = 1;', testCode: 'test("x", () => {});' };

const mirror: NpmProfile = { source: 'mirror', url: 'http://npm-registry:4873', scopeUrl: 'http://npm-registry:4873', scopes: ['@tazama-lf'] };
const offline: NpmProfile = { ...mirror, source: 'offline', cacheDir: '/cache' };

const jestEntry = { version: '30.0.0', resolved: 'https://registry.npmjs.org/jest/-/jest-30.0.0.tgz', integrity: 'sha512-npmjs' };
const coeLib = {
  version: '8.3.0',
  resolved: 'https://npm.pkg.github.com/download/@tazama-lf/frms-coe-lib/8.3.0/abc',
  integrity: 'sha512-github',
};
const lockfile = { lockfileVersion: 3, packages: { '': { name: 'x' }, 'node_modules/jest': jestEntry, 'node_modules/@tazama-lf/frms-coe-lib': coeLib } };

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

describe('assertValidRuleSource', () => {
  it.each(['903', 'rule-001', 'amount.check_v2'])('accepts rule id %s', (ruleId) => {
    expect(() => assertValidRuleSource({ ...source, ruleId })).not.toThrow();
  });

  it.each(['', 'Rule-1', '../etc', 'a b', '-lead', 'a\nRUN id', 'x'.repeat(65)])('rejects rule id %j', (ruleId) => {
    expect(() => assertValidRuleSource({ ...source, ruleId })).toThrow('Invalid rule id');
  });

  it.each(['1.0.0', '4.0.0-rc.6', '10.20.30-beta-1'])('accepts version %s', (version) => {
    expect(() => assertValidRuleSource({ ...source, version })).not.toThrow();
  });

  it.each(['rc', '1.0', '1.0.0+build', '1.0.0\nRUN curl evil', '1.0.0 x'])('rejects version %j', (version) => {
    expect(() => assertValidRuleSource({ ...source, version })).toThrow('Invalid rule version');
  });
});

describe('npmrc', () => {
  it('routes unscoped and scoped packages to their registries', () => {
    expect(npmrc({ ...mirror, url: 'https://registry.npmjs.org', scopeUrl: 'https://npm.pkg.github.com' })).toBe(
      'registry=https://registry.npmjs.org/\n@tazama-lf:registry=https://npm.pkg.github.com/\n',
    );
  });

  it('references the token through the environment instead of writing it', () => {
    const rc = npmrc({ ...mirror, scopeUrl: 'https://npm.pkg.github.com', token: 'ghp_secret' });

    expect(rc).toContain('//npm.pkg.github.com/:_authToken=${NPM_TOKEN}');
    expect(rc).not.toContain('ghp_secret');
  });

  it('allows no network access at all when offline', () => {
    expect(npmrc(offline)).toBe('offline=true\n');
  });
});

describe('assertLockfileIntegrity', () => {
  it('accepts packages that all carry a SHA-512, plus links, bundled and file dependencies', () => {
    const packages = {
      '': {},
      'node_modules/jest': jestEntry,
      'node_modules/local': { link: true },
      'node_modules/a/node_modules/b': { version: '1.0.0', inBundle: true },
      'node_modules/rule': { version: '1.0.0', resolved: 'file:rule.tgz' },
    };

    expect(() => assertLockfileIntegrity(packages, 'rule template')).not.toThrow();
  });

  it('names the packages that have no integrity hash', () => {
    const packages = { 'node_modules/jest': jestEntry, 'node_modules/@tazama-lf/frms-coe-lib': { version: '8.3.0', resolved: coeLib.resolved } };

    expect(() => assertLockfileIntegrity(packages, 'rule template')).toThrow(
      'The rule template lockfile has no integrity hash for 1 package(s): @tazama-lf/frms-coe-lib',
    );
  });
});

describe('workspace preparation', () => {
  let root: string;
  let template: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'rule-workspace-spec-'));
    template = join(root, 'template');
    write(join(template, 'package.json'), JSON.stringify({ name: '@tazama-lf/rule-901', version: '0.0.1', scripts: { prepare: 'husky', test: 'jest' } }));
    write(join(template, 'package-lock.json'), JSON.stringify(lockfile));
    write(join(template, '.npmrc'), '//npm.pkg.github.com/:_authToken=${GH_TOKEN}\n');
    write(join(template, 'src', 'index.ts'), "export * from './rule';");
    write(join(template, 'src', 'lib', 'helper.ts'), 'export {};');
    write(join(template, 'node_modules', 'x', 'index.js'), '');
    write(join(template, 'lib', 'index.js'), '');
    write(join(template, 'reports', 'unit-tests', 'latest', 'index.html'), '');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('copies the template without build output and adds the rule', () => {
    const work = join(root, 'work');

    prepareWorkspace(source, template, work, mirror);

    expect(readFileSync(join(work, 'src', 'rule.ts'), 'utf8')).toBe(source.ruleCode);
    expect(readFileSync(join(work, '__tests__', 'unit', 'rule.test.ts'), 'utf8')).toBe(source.testCode);
    expect(existsSync(join(work, 'src', 'lib', 'helper.ts'))).toBe(true);
    for (const skipped of ['node_modules', 'lib', 'reports']) expect(existsSync(join(work, skipped))).toBe(false);
    expect(JSON.parse(readFileSync(join(work, 'package.json'), 'utf8'))).toEqual({
      name: '@tazama-lf/rule-903',
      version: '1.0.0',
      scripts: { test: 'jest' },
    });
    expect(readFileSync(join(work, '.npmrc'), 'utf8')).toBe(npmrc(mirror));
  });

  it('fetches from the configured registry but keeps every SHA-512, including GitHub Packages ones', () => {
    const work = join(root, 'work');

    prepareWorkspace(source, template, work, mirror);

    const packages = JSON.parse(readFileSync(join(work, 'package-lock.json'), 'utf8')).packages;
    expect(packages['node_modules/jest']).toEqual({ version: '30.0.0', integrity: 'sha512-npmjs' });
    expect(packages['node_modules/@tazama-lf/frms-coe-lib']).toEqual({ version: '8.3.0', integrity: 'sha512-github' });
  });

  it('leaves the lockfile untouched for an offline build', () => {
    const work = join(root, 'work');

    prepareWorkspace(source, template, work, offline);

    expect(JSON.parse(readFileSync(join(work, 'package-lock.json'), 'utf8'))).toEqual(lockfile);
  });

  it('refuses a template whose lockfile is missing a hash', () => {
    const { integrity: _dropped, ...unverified } = coeLib;
    write(join(template, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/@tazama-lf/frms-coe-lib': unverified } }));

    expect(() => prepareWorkspace(source, template, join(root, 'work'), mirror)).toThrow(
      'The rule template lockfile has no integrity hash for 1 package(s): @tazama-lf/frms-coe-lib',
    );
  });

  it('copies only the rule-executer sources needed to build it', () => {
    const executer = join(root, 'executer');
    write(join(executer, 'package.json'), '{}');
    write(join(executer, 'package-lock.json'), JSON.stringify(lockfile));
    write(join(executer, 'tsconfig.json'), '{}');
    write(join(executer, 'src', 'index.ts'), '');
    write(join(executer, 'Dockerfile'), 'FROM x');
    write(join(executer, 'node_modules', 'x', 'index.js'), '');
    const exec = join(root, 'exec');

    prepareExecuter(executer, exec, mirror);

    expect(existsSync(join(exec, 'src', 'index.ts'))).toBe(true);
    expect(existsSync(join(exec, 'Dockerfile'))).toBe(false);
    expect(existsSync(join(exec, 'node_modules'))).toBe(false);
    expect(readFileSync(join(exec, '.npmrc'), 'utf8')).toBe(npmrc(mirror));
  });
});
