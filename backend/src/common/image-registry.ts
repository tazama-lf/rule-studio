const DOCKER_HUB_HOSTS = new Set(['docker.io', 'index.docker.io', 'registry-1.docker.io']);
const LOCAL_HOST = /^(localhost|127(?:\.\d{1,3}){3}|host\.docker\.internal)(:\d+)?$/;

export interface ImageRegistry {
  registry: string;
  namespace: string;
  username?: string;
  token?: string;
  dockerHub: boolean;
}

const value = (setting?: string): string | undefined => {
  const trimmed = setting?.trim();
  return trimmed === '' ? undefined : trimmed;
};

const normalize = (registry?: string): string => value(registry)?.replace(/\/+$/, '') ?? 'docker.io';

export const isDockerHub = (registry?: string): boolean => DOCKER_HUB_HOSTS.has(normalize(registry));

export function loadImageRegistry(env: Record<string, string | undefined> = process.env): ImageRegistry {
  const registry = normalize(env.IMAGE_REGISTRY);
  return {
    registry,
    namespace: value(env.IMAGE_NAMESPACE) ?? 'tazamaorg',
    username: value(env.IMAGE_REGISTRY_USERNAME),
    token: value(env.IMAGE_REGISTRY_TOKEN),
    dockerHub: DOCKER_HUB_HOSTS.has(registry),
  };
}

export function imageRef(registry: ImageRegistry, repository: string, tag: string): string {
  const path = `${registry.namespace}/${repository}:${tag}`;
  return registry.dockerHub ? path : `${registry.registry}/${path}`;
}

export function registryApiUrl(registry: ImageRegistry, hostOverride = process.env.TESTCONTAINERS_HOST_OVERRIDE): string {
  const local = LOCAL_HOST.test(registry.registry);
  const host = local && hostOverride ? registry.registry.replace(/^[^:]+/, hostOverride) : registry.registry;
  return `${local ? 'http' : 'https'}://${host}`;
}

export function tenantRepository(tenantId: string, name: string): string {
  const prefix = `${tenantId.toLowerCase()}-`;
  return name.toLowerCase().startsWith(prefix) ? name : `${prefix}${name}`;
}
