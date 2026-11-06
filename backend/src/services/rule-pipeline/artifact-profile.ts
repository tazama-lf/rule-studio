import { resolve } from 'node:path';
import { loadImageRegistry, tenantRepository } from '../../common/image-registry';

export type NpmSource = 'public' | 'mirror' | 'offline';

export interface NpmProfile {
  source: NpmSource;
  url: string;
  scopeUrl: string;
  token?: string;
  scopes: string[];
  cacheDir?: string;
}

export interface ImageProfile {
  build: boolean;
  registry?: string;
  namespace: string;
  username?: string;
  password?: string;
}

export type GitProviderKind = 'gitea' | 'github' | 'none';

export interface GitProfile {
  kind: GitProviderKind;
  apiUrl: string;
  owner: string;
  token?: string;
  branch: string;
}

export interface BaseImages {
  node: string;
  runtime: string;
}

export interface PipelineSources {
  templateDir: string;
  executerDir: string;
}

export interface BuilderSettings {
  network?: string;
  stepTimeoutMs?: number;
}

export interface ArtifactProfile {
  npm: NpmProfile;
  image: ImageProfile;
  git: GitProfile;
  baseImages: BaseImages;
  sources: PipelineSources;
  builder: BuilderSettings;
}

const NPMJS = 'https://registry.npmjs.org';
const GITHUB_PACKAGES = 'https://npm.pkg.github.com';

function oneOf<T extends string>(value: string | undefined, fallback: T, allowed: readonly T[], name: string): T {
  const chosen = (value ?? fallback) as T;
  if (!allowed.includes(chosen)) throw new Error(`${name} must be one of ${allowed.join(', ')} (got '${value}')`);
  return chosen;
}

function required(value: string | undefined, name: string, reason: string): string {
  if (!value) throw new Error(`${name} is required ${reason}`);
  return value;
}

const trimSlash = (url: string): string => url.replace(/\/$/, '');

function loadNpm(env: NodeJS.ProcessEnv): NpmProfile {
  const source = oneOf(env.RULE_NPM_SOURCE, 'public', ['public', 'mirror', 'offline'], 'RULE_NPM_SOURCE');
  const url = source === 'mirror' ? required(env.RULE_NPM_REGISTRY_URL, 'RULE_NPM_REGISTRY_URL', 'when RULE_NPM_SOURCE=mirror') : NPMJS;
  return {
    source,
    url: trimSlash(url),
    scopeUrl: trimSlash(env.RULE_NPM_SCOPE_REGISTRY_URL ?? (source === 'mirror' ? url : GITHUB_PACKAGES)),
    token: env.RULE_NPM_TOKEN,
    scopes: (env.RULE_NPM_SCOPES ?? '@tazama-lf,@frmscoe')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    cacheDir: source === 'offline' ? required(env.RULE_NPM_CACHE, 'RULE_NPM_CACHE', 'when RULE_NPM_SOURCE=offline') : undefined,
  };
}

function loadImage(env: NodeJS.ProcessEnv): ImageProfile {
  const target = loadImageRegistry(env);
  const publish = /^(true|1|yes|on)$/i.test((env.DOCKER_PUBLISH ?? '').trim());
  return {
    build: env.RULE_IMAGE_BUILD !== 'false',
    registry: publish ? target.registry : undefined,
    namespace: target.namespace,
    username: target.username,
    password: target.token,
  };
}

function loadGit(env: NodeJS.ProcessEnv): GitProfile {
  const kind = oneOf(env.RULE_GIT_KIND, 'none', ['none', 'gitea', 'github'], 'RULE_GIT_KIND');
  const defaultUrl = kind === 'github' ? 'https://api.github.com' : undefined;
  return {
    kind,
    apiUrl: kind === 'none' ? '' : trimSlash(required(env.RULE_GIT_API_URL ?? defaultUrl, 'RULE_GIT_API_URL', `for RULE_GIT_KIND=${kind}`)),
    owner: env.RULE_GIT_OWNER ?? 'tazama-rules',
    token: env.RULE_GIT_TOKEN,
    branch: env.RULE_GIT_BRANCH ?? 'staging',
  };
}

export function loadArtifactProfile(env: NodeJS.ProcessEnv = process.env): ArtifactProfile {
  const mirror = env.RULE_BASE_IMAGE_MIRROR ? `${trimSlash(env.RULE_BASE_IMAGE_MIRROR)}/` : '';
  return {
    npm: loadNpm(env),
    image: loadImage(env),
    git: loadGit(env),
    baseImages: {
      node: env.RULE_BUILDER_NODE_IMAGE ?? `${mirror}node:20-slim`,
      runtime: env.RULE_RUNTIME_IMAGE ?? `${mirror || 'gcr.io/'}distroless/nodejs20-debian11:nonroot`,
    },
    sources: {
      templateDir: resolve(env.RULE_TEMPLATE_DIR ?? 'rule-pipeline/template'),
      executerDir: resolve(env.RULE_EXECUTER_DIR ?? 'rule-pipeline/executer'),
    },
    builder: {
      network: env.RULE_BUILDER_NETWORK === '' ? undefined : env.RULE_BUILDER_NETWORK,
      stepTimeoutMs: env.RULE_STEP_TIMEOUT_SECONDS ? Number(env.RULE_STEP_TIMEOUT_SECONDS) * 1000 : undefined,
    },
  };
}

export function ruleImageRef(image: ImageProfile, ruleId: string, version: string, tenantId = 'DEFAULT'): string {
  const repo = `${image.namespace}/${tenantRepository(tenantId, `rule-${ruleId}`)}:${version}`;
  return image.registry ? `${image.registry}/${repo}` : repo;
}
