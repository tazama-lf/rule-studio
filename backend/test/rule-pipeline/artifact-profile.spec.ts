import { describe, expect, it } from '@jest/globals';
import { loadArtifactProfile, ruleImageRef } from '../../src/services/rule-pipeline/artifact-profile';

describe('loadArtifactProfile', () => {
  it('defaults to public npm, Docker Hub, no git and no deployment', () => {
    const profile = loadArtifactProfile({});

    expect(profile.npm).toEqual({
      source: 'public',
      url: 'https://registry.npmjs.org',
      scopeUrl: 'https://npm.pkg.github.com',
      token: undefined,
      scopes: ['@tazama-lf', '@frmscoe'],
      cacheDir: undefined,
    });
    expect(profile.image).toEqual({ build: true, registry: 'docker.io', namespace: 'tazamaorg', username: undefined, password: undefined });
    expect(profile.git.kind).toBe('none');
    expect(profile.deploy).toBeUndefined();
    expect(profile.baseImages).toEqual({ node: 'node:20-slim', runtime: 'gcr.io/distroless/nodejs20-debian11:nonroot' });
  });

  it('sends every npm package through a mirror, bundled or the operator’s own', () => {
    const profile = loadArtifactProfile({ RULE_NPM_SOURCE: 'mirror', RULE_NPM_REGISTRY_URL: 'https://nexus.corp/repository/npm/', RULE_NPM_TOKEN: 't' });

    expect(profile.npm).toMatchObject({ source: 'mirror', url: 'https://nexus.corp/repository/npm', scopeUrl: 'https://nexus.corp/repository/npm', token: 't' });
    expect(() => loadArtifactProfile({ RULE_NPM_SOURCE: 'mirror' })).toThrow('RULE_NPM_REGISTRY_URL is required when RULE_NPM_SOURCE=mirror');
  });

  it('builds from an npm cache with no registry when offline', () => {
    expect(loadArtifactProfile({ RULE_NPM_SOURCE: 'offline', RULE_NPM_CACHE: '/bundle/npm-cache' }).npm).toMatchObject({
      source: 'offline',
      cacheDir: '/bundle/npm-cache',
    });
    expect(() => loadArtifactProfile({ RULE_NPM_SOURCE: 'offline' })).toThrow('RULE_NPM_CACHE is required when RULE_NPM_SOURCE=offline');
  });

  it('makes the image optional and always pushes it to IMAGE_REGISTRY', () => {
    expect(loadArtifactProfile({ RULE_IMAGE_BUILD: 'false' }).image.build).toBe(false);
    expect(loadArtifactProfile({ IMAGE_REGISTRY: 'harbor.corp/', IMAGE_NAMESPACE: 'rules' }).image).toMatchObject({
      build: true,
      registry: 'harbor.corp',
      namespace: 'rules',
    });
    expect(loadArtifactProfile({ DOCKER_PUBLISH: 'false' }).image).toMatchObject({ registry: 'docker.io', namespace: 'tazamaorg' });
  });

  it('deploys into the Tazama network only with the Tazama services and API account configured', () => {
    const env = {
      RULE_DEPLOY_NETWORK: 'tazama-core_default',
      RULE_DEPLOY_ENV_FILE: '/data/rule-deploy.env',
      ADMIN_SERVICE_URL: 'http://admin:3100/',
      TAZAMA_AUTH_URL: 'http://auth:3020/v1/auth',
      TAZAMA_TMS_URL: 'http://tms:3000',
      TAZAMA_NATS_UTILS_URL: 'http://nats-utilities:4000/',
      TAZAMA_API_USERNAME: 'api@tazama.org',
      TAZAMA_API_PASSWORD: 'secret',
    };

    expect(loadArtifactProfile(env).deploy).toEqual({
      network: 'tazama-core_default',
      envFile: '/data/rule-deploy.env',
      adminUrl: 'http://admin:3100',
      authUrl: 'http://auth:3020/v1/auth',
      tmsUrl: 'http://tms:3000',
      natsUtilsUrl: 'http://nats-utilities:4000',
      username: 'api@tazama.org',
      password: 'secret',
    });
    expect(() => loadArtifactProfile({ ...env, TAZAMA_TMS_URL: undefined })).toThrow('TAZAMA_TMS_URL is required when RULE_DEPLOY_NETWORK is set');
    expect(loadArtifactProfile({ ...env, RULE_DEPLOY_NETWORK: ' ' }).deploy).toBeUndefined();
  });

  it('pulls both base images from a mirror when one is set', () => {
    expect(loadArtifactProfile({ RULE_BASE_IMAGE_MIRROR: 'localhost:5000' }).baseImages).toEqual({
      node: 'localhost:5000/node:20-slim',
      runtime: 'localhost:5000/distroless/nodejs20-debian11:nonroot',
    });
    expect(loadArtifactProfile({ RULE_BASE_IMAGE_MIRROR: 'localhost:5000', RULE_BUILDER_NODE_IMAGE: 'my/node:20' }).baseImages.node).toBe('my/node:20');
  });

  it('keeps git off unless a kind is chosen, and needs a URL for gitea', () => {
    expect(loadArtifactProfile({ RULE_GIT_KIND: 'github', RULE_GIT_OWNER: 'acme' }).git).toMatchObject({
      kind: 'github',
      apiUrl: 'https://api.github.com',
      owner: 'acme',
      branch: 'staging',
    });
    expect(loadArtifactProfile({ RULE_GIT_KIND: 'gitea', RULE_GIT_API_URL: 'http://gitea:3000/' }).git.apiUrl).toBe('http://gitea:3000');
    expect(() => loadArtifactProfile({ RULE_GIT_KIND: 'gitea' })).toThrow('RULE_GIT_API_URL is required for RULE_GIT_KIND=gitea');
  });

  it('rejects unknown npm sources and git kinds', () => {
    expect(() => loadArtifactProfile({ RULE_NPM_SOURCE: 'cloud' })).toThrow('RULE_NPM_SOURCE must be one of public, mirror, offline');
    expect(() => loadArtifactProfile({ RULE_GIT_KIND: 'gitlab' })).toThrow('RULE_GIT_KIND must be one of none, gitea, github');
  });
});

describe('ruleImageRef', () => {
  it('names the image after the tenant and prefixes the registry unless it is Docker Hub', () => {
    const image = { build: true, namespace: 'tazama' };

    expect(ruleImageRef({ ...image, registry: 'localhost:5000' }, '903', '1.0.0')).toBe('localhost:5000/tazama/default-rule-903:1.0.0');
    expect(ruleImageRef({ ...image, registry: 'docker.io' }, '903', '1.0.0', 'CBE')).toBe('tazama/cbe-rule-903:1.0.0');
  });
});
