import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { loadArtifactProfile } from '../../src/services/rule-pipeline/artifact-profile';
import { RuleBuildError, RulePipelineService, type RuleSource } from '../../src/services/rule-pipeline/rule-pipeline.service';

jest.mock('testcontainers', () => ({
  GenericContainer: jest.fn(),
  getContainerRuntimeClient: jest.fn(),
}));

import { GenericContainer, getContainerRuntimeClient } from 'testcontainers';

const MockGenericContainer = GenericContainer as jest.MockedClass<typeof GenericContainer>;

type Exec = { exitCode: number; output: string; stdout: string; stderr: string };
const ok = (stdout = ''): Exec => ({ exitCode: 0, output: stdout, stdout, stderr: '' });
const failed = (output: string): Exec => ({ exitCode: 1, output, stdout: '', stderr: output });

const source: RuleSource = { ruleId: '903', version: '1.0.0', ruleCode: 'export {};', testCode: 'test("x", () => {});' };
const tgz = Buffer.from('packed rule');
const integrity = `sha512-${createHash('sha512').update(tgz).digest('base64')}`;
const shasum = createHash('sha1').update(tgz).digest('hex');
const tgzFile = 'tazama-lf-rule-903-1.0.0.tgz';
const passing = JSON.stringify({ numTotalTests: 4, numPassedTests: 4, numFailedTests: 0, numTotalTestSuites: 1, numPassedTestSuites: 1 });

const mockExec = jest.fn<(cmd: string[], opts?: { user?: string; env?: Record<string, string> }) => Promise<Exec>>();
const mockStop = jest.fn<() => Promise<void>>();
const mockCopyContent = jest.fn<(files: Array<{ content: string; target: string }>) => Promise<void>>();
const mockBuildImage = jest.fn<(context: unknown, opts: Record<string, unknown>) => Promise<Readable>>();
const mockPush = jest.fn<(opts: Record<string, unknown>) => Promise<Readable>>();
let dockerEvents: unknown[];
const builder = {
  withCommand: jest.fn(),
  withResourcesQuota: jest.fn(),
  withCopyDirectoriesToContainer: jest.fn(),
  withNetworkMode: jest.fn(),
  withExtraHosts: jest.fn(),
  start: jest.fn<() => Promise<unknown>>(),
};

function answer(overrides: Record<string, Exec | Promise<Exec>> = {}): void {
  const defaults: Record<string, Exec> = {
    'test-results.json': ok(passing),
    'index.html': ok('<html>report</html>'),
    'ls *.tgz': ok(`${tgzFile}\n`),
    'sha512sum': ok(`${createHash('sha512').update(tgz).digest('hex')}  /out/${tgzFile}\n`),
    'base64 -w0': ok(tgz.toString('base64')),
  };
  mockExec.mockImplementation(async (cmd) => {
    const command = cmd.join(' ');
    const key = Object.keys(overrides).find((fragment) => command.includes(fragment));
    if (key) return await overrides[key];
    const fallback = Object.keys(defaults).find((fragment) => command.includes(fragment));
    return fallback ? defaults[fallback] : ok();
  });
}

const commands = (): string[] => mockExec.mock.calls.map(([cmd]) => cmd.join(' '));

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

describe('RulePipelineService', () => {
  let root: string;
  let options: { templateDir: string; executerDir: string };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'rule-pipeline-spec-'));
    for (const dir of ['template', 'executer']) {
      write(join(root, dir, 'package.json'), '{}');
      write(join(root, dir, 'package-lock.json'), '{"packages":{}}');
      write(join(root, dir, 'tsconfig.json'), '{}');
      write(join(root, dir, 'src', 'index.ts'), '');
    }
    options = { templateDir: join(root, 'template'), executerDir: join(root, 'executer') };

    for (const key of Object.keys(builder) as Array<keyof typeof builder>) {
      if (key !== 'start') builder[key].mockReturnThis();
    }
    builder.start.mockResolvedValue({
      exec: mockExec,
      stop: mockStop,
      copyContentToContainer: mockCopyContent,
      copyArchiveFromContainer: async () => Readable.from([]),
    });
    MockGenericContainer.mockImplementation(() => builder as never);
    mockStop.mockResolvedValue(undefined);
    mockCopyContent.mockResolvedValue(undefined);
    mockBuildImage.mockResolvedValue(Readable.from([]));
    mockPush.mockResolvedValue(Readable.from([]));
    dockerEvents = [{ stream: 'ok' }];
    (getContainerRuntimeClient as jest.Mock<any>).mockResolvedValue({
      container: {
        dockerode: {
          buildImage: mockBuildImage,
          getImage: () => ({ push: mockPush, inspect: async () => ({ Id: 'sha256:image-id' }) }),
          modem: { followProgress: (_stream: unknown, done: (err: null, out: unknown[]) => void) => done(null, dockerEvents) },
        },
      },
    });
    answer();
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('rejects an invalid rule before starting any container', async () => {
    const pipeline = new RulePipelineService(loadArtifactProfile({}));

    await expect(pipeline.build({ ...source, version: '1.0.0\nRUN id' }, options)).rejects.toThrow('Invalid rule version');
    expect(MockGenericContainer).not.toHaveBeenCalled();
  });

  it('produces the package with its SHA-512 and an image, running every step as the unprivileged user', async () => {
    const pipeline = new RulePipelineService(loadArtifactProfile({ RULE_BASE_IMAGE_MIRROR: 'localhost:5000', RULE_NPM_TOKEN: 'npm-secret' }));

    const result = await pipeline.build(source, options);

    expect(result).toMatchObject({
      tests: { total: 4, passed: 4, failed: 0, success: true, coverageThresholdMet: true },
      reportHtml: '<html>report</html>',
      package: { file: tgzFile, integrity, shasum, size: tgz.length, tgz },
      image: { ref: 'tazamaorg/default-rule-903:1.0.0', id: 'sha256:image-id' },
    });
    expect(result.image?.digest).toBeUndefined();
    expect(builder.withResourcesQuota).toHaveBeenCalledWith({ memory: 2, cpu: 2 });
    const steps = mockExec.mock.calls.filter(([cmd]) => cmd[0] === 'sh' && !cmd[2].startsWith('mkdir'));
    expect(steps.length).toBeGreaterThan(0);
    for (const [, opts] of steps) {
      expect(opts).toEqual({ user: 'node', env: { HOME: '/home/node', NPM_TOKEN: 'npm-secret' } });
    }
    const dockerfile = mockCopyContent.mock.calls[0][0][0];
    expect(dockerfile.target).toBe('/ctx/Dockerfile');
    expect(dockerfile.content).toContain('FROM localhost:5000/distroless/nodejs20-debian11:nonroot');
    expect(dockerfile.content).toContain(`tazama.rule.integrity="${integrity}"`);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockStop).toHaveBeenCalled();
  });

  it('stops after the package when no image is wanted', async () => {
    const result = await new RulePipelineService(loadArtifactProfile({ RULE_IMAGE_BUILD: 'false' })).build(source, options);

    expect(result.package?.integrity).toBe(integrity);
    expect(result.image).toBeUndefined();
    expect(commands().some((c) => c.includes('cd /exec'))).toBe(false);
    expect(mockBuildImage).not.toHaveBeenCalled();
  });

  it('fails when the package bytes copied out of the builder do not match their SHA-512 in the builder', async () => {
    answer({ 'base64 -w0': ok(Buffer.from('tampered').toString('base64')) });

    await expect(new RulePipelineService(loadArtifactProfile({})).build(source, options)).rejects.toThrow(
      'tazama-lf-rule-903-1.0.0.tgz changed while copying out of the builder',
    );
    expect(mockStop).toHaveBeenCalled();
  });

  it('reports coverage separately from test success', async () => {
    answer({ 'npx jest': failed('coverage threshold not met') });

    const result = await new RulePipelineService(loadArtifactProfile({})).build(source, options);

    expect(result.tests).toMatchObject({ success: true, coverageThresholdMet: false });
    expect(result.image?.ref).toBe('tazamaorg/default-rule-903:1.0.0');
  });

  it('packages nothing when unit tests fail', async () => {
    const results = JSON.stringify({ numTotalTests: 13, numPassedTests: 4, numFailedTests: 9, numTotalTestSuites: 1, numPassedTestSuites: 0 });
    answer({ 'npx jest': failed('9 failed'), 'test-results.json': ok(results) });

    const result = await new RulePipelineService(loadArtifactProfile({})).build(source, options);

    expect(result.tests).toMatchObject({ total: 13, failed: 9, success: false });
    expect(result.reportHtml).toBe('<html>report</html>');
    expect(result.package).toBeUndefined();
    expect(result.image).toBeUndefined();
    expect(commands().some((c) => c.includes('npm pack'))).toBe(false);
    expect(mockStop).toHaveBeenCalled();
  });

  it('treats a test suite that fails to compile as a failure', async () => {
    const results = JSON.stringify({ numTotalTests: 0, numPassedTests: 0, numFailedTests: 0, numTotalTestSuites: 1, numPassedTestSuites: 0 });
    answer({ 'npx jest': failed('TS2307'), 'test-results.json': ok(results) });

    const result = await new RulePipelineService(loadArtifactProfile({})).build(source, options);

    expect(result.tests.success).toBe(false);
    expect(result.package).toBeUndefined();
  });

  it('pushes to the configured registry with credentials and records the manifest digest', async () => {
    dockerEvents = [{ status: 'pushed' }, { aux: { Tag: '1.0.0', Digest: 'sha256:manifest', Size: 1234 } }];
    const pipeline = new RulePipelineService(
      loadArtifactProfile({ DOCKER_PUBLISH: 'true', IMAGE_REGISTRY: 'harbor.corp', IMAGE_REGISTRY_USERNAME: 'bot', IMAGE_REGISTRY_TOKEN: 'pw' }),
    );

    const result = await pipeline.build(source, options);

    expect(result.image).toEqual({ ref: 'harbor.corp/tazamaorg/default-rule-903:1.0.0', id: 'sha256:image-id', digest: 'sha256:manifest' });
    expect(mockPush).toHaveBeenCalledWith({ authconfig: { username: 'bot', password: 'pw', serveraddress: 'harbor.corp' } });
    expect(mockBuildImage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ registryconfig: { 'harbor.corp': { username: 'bot', password: 'pw' } } }),
    );
  });

  it('builds offline from the npm cache with no network at all', async () => {
    const cache = join(root, 'npm-cache');
    mkdirSync(cache);

    await new RulePipelineService(loadArtifactProfile({ RULE_NPM_SOURCE: 'offline', RULE_NPM_CACHE: cache })).build(source, options);

    expect(builder.withNetworkMode).toHaveBeenCalledWith('none');
    expect(builder.withCopyDirectoriesToContainer).toHaveBeenCalledWith(expect.arrayContaining([{ source: cache, target: '/home/node/.npm' }]));
    expect(commands()[0]).toContain('chown -R node /work /exec /out /ctx /home/node/.npm');
  });

  it('says how to fix an offline npm cache that misses a locked package, without the npm warnings', async () => {
    const cache = join(root, 'npm-cache');
    mkdirSync(cache);
    answer({ 'npm pkg set dependencies.rule': failed('npm warn deprecated glob@7.2.3: old\nnpm error code ENOTCACHED\nnpm error request to x failed') });

    const build = new RulePipelineService(loadArtifactProfile({ RULE_NPM_SOURCE: 'offline', RULE_NPM_CACHE: cache })).build(source, options);

    await expect(build).rejects.toThrow(/rule-executer build failed \(exit 1\):\nnpm error code ENOTCACHED\nnpm error request to x failed\nThe offline npm cache/);
    await expect(build).rejects.not.toThrow('npm warn');
  });

  it('keeps what a failed build did and names the stage it failed at', async () => {
    answer({ 'npm run build': failed('src/rule.ts(31,23): error TS2339') });

    const error = await new RulePipelineService(loadArtifactProfile({})).build(source, options).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(RuleBuildError);
    expect(error).toMatchObject({ stage: 'package', partial: { tests: { success: true }, durationsMs: { install: expect.any(Number), test: expect.any(Number) } } });
    expect((error as RuleBuildError).message).toContain('error TS2339');
  });

  it('refuses an offline build whose npm cache does not exist', async () => {
    const pipeline = new RulePipelineService(loadArtifactProfile({ RULE_NPM_SOURCE: 'offline', RULE_NPM_CACHE: join(root, 'missing') }));

    await expect(pipeline.build(source, options)).rejects.toThrow('does not exist');
    expect(MockGenericContainer).not.toHaveBeenCalled();
  });

  it('fails with the step output and stops the builder when a step fails', async () => {
    answer({ 'npm ci': failed('npm error code EINTEGRITY') });

    await expect(new RulePipelineService(loadArtifactProfile({})).build(source, options)).rejects.toThrow(
      /npm ci failed \(exit 1\):\nnpm error code EINTEGRITY/,
    );
    expect(mockStop).toHaveBeenCalled();
  });

  it('times out a step that never finishes and stops the builder', async () => {
    answer({ 'npm ci': new Promise<Exec>(() => undefined) });

    await expect(new RulePipelineService(loadArtifactProfile({})).build(source, { ...options, stepTimeoutMs: 50 })).rejects.toThrow(
      'npm ci timed out',
    );
    expect(mockStop).toHaveBeenCalled();
  });

  it('fails the build when Docker reports an error inside the build stream', async () => {
    dockerEvents = [{ error: 'pull access denied' }];

    await expect(new RulePipelineService(loadArtifactProfile({})).build(source, options)).rejects.toThrow(
      'docker build tazamaorg/default-rule-903:1.0.0 failed: pull access denied',
    );
    expect(mockStop).toHaveBeenCalled();
  });
});
