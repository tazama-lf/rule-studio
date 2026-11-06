/* eslint-disable no-console -- CLI output */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import type { FeatureFlagsService } from '../src/common/feature-flags/feature-flags.service';
import { loadArtifactProfile } from '../src/services/rule-pipeline/artifact-profile';
import { RulePipelineService } from '../src/services/rule-pipeline/rule-pipeline.service';
import { EphemeralEnvService } from '../src/services/simulation-studio/ephemeral-env/ephemeral-env.service';

async function main(): Promise<void> {
  const { values: args } = parseArgs({
    options: {
      'rule': { type: 'string' },
      'version': { type: 'string', default: '1.0.0' },
      'rule-file': { type: 'string' },
      'test-file': { type: 'string' },
      'template': { type: 'string' },
      'executer': { type: 'string' },
      'network': { type: 'string' },
      'allow-failing-tests': { type: 'boolean', default: false },
      'simulate': { type: 'boolean', default: false },
      'out': { type: 'string', default: 'rule-pipeline-out' },
    },
  });
  const required = (name: 'rule' | 'rule-file' | 'test-file' | 'template' | 'executer'): string => {
    const value = args[name];
    if (!value) throw new Error(`--${name} is required`);
    return value;
  };

  const profile = loadArtifactProfile();
  console.log('Artifact profile:', JSON.stringify(redact(profile), null, 2));

  const pipeline = new RulePipelineService(profile);
  const result = await pipeline.build(
    {
      ruleId: required('rule'),
      version: args.version,
      ruleCode: readFileSync(required('rule-file'), 'utf8'),
      testCode: readFileSync(required('test-file'), 'utf8'),
    },
    {
      templateDir: resolve(required('template')),
      executerDir: resolve(required('executer')),
      networkMode: args.network,
      allowFailingTests: args['allow-failing-tests'],
    },
  );

  const out = resolve(args.out);
  mkdirSync(out, { recursive: true });
  if (result.reportHtml) writeFileSync(join(out, `rule-${result.ruleId}-report.html`), result.reportHtml);
  if (result.package) writeFileSync(join(out, result.package.file), result.package.tgz);
  const { reportHtml: _report, package: rulePackage, ...summary } = result;
  const { tgz: _tgz, ...packageInfo } = rulePackage ?? {};
  console.log('Build result:', JSON.stringify({ ...summary, package: rulePackage ? packageInfo : undefined }, null, 2));
  if (!result.tests.success) process.exitCode = 1;

  if (args.simulate && result.image) {
    const env = new EphemeralEnvService({ isSimStudioEnabled: () => true } as unknown as FeatureFlagsService);
    const name = `poc-rule-${result.ruleId}`;
    const started = Date.now();
    try {
      const info = await env.spawn(name, { ruleName: `rule-${result.ruleId}`, version: result.version, image: result.image.ref });
      console.log(
        `Simulation up in ${Date.now() - started} ms:`,
        JSON.stringify({ image: info.image, subject: info.natsSubject, ports: info.ports }),
      );
    } finally {
      await env.destroyAll();
      console.log('Simulation torn down');
    }
  }
}

function redact<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (key, v: unknown) => (/token|password/i.test(key) && v ? '***' : v))) as T;
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
/* eslint-enable no-console */
