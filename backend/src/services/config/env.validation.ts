import { plainToClass, Transform } from 'class-transformer';
import { IsEnum, IsString, IsNumberString, IsBoolean, IsNotEmpty, IsOptional, ValidateIf, validateSync } from 'class-validator';
import { Logger } from '@nestjs/common';
import { isDockerHub } from '../../common/image-registry';

enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
  DEV = 'dev',
  PROD = 'prod',
}

const TRUTHY = new Set(['true', '1', 'yes', 'on']);
const toBool = ({ value }: { value: unknown }): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return TRUTHY.has(value.trim().toLowerCase());
  return false;
};

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.DEVELOPMENT;
  @IsNumberString()
  MAX_CPU: string;
  @IsString()
  FUNCTION_NAME: string;
  @IsString()
  TAZAMA_AUTH_URL: string;
  @IsString()
  AUTH_PUBLIC_KEY_PATH: string;
  @IsString()
  CERT_PATH_PUBLIC: string;

  // Optional switch. When absent or falsy, Docker publishing and the whole
  // SimStudio surface are disabled and the IMAGE_* settings are not required.
  // When true, IMAGE_NAMESPACE is required, plus the credentials for Docker Hub.
  @Transform(toBool)
  @IsBoolean()
  DOCKER_PUBLISH = false;

  @ValidateIf((o: EnvironmentVariables) => o.DOCKER_PUBLISH)
  @IsString()
  @IsNotEmpty()
  IMAGE_NAMESPACE?: string;

  @ValidateIf((o: EnvironmentVariables) => o.DOCKER_PUBLISH && isDockerHub(o.IMAGE_REGISTRY))
  @IsString()
  @IsNotEmpty()
  IMAGE_REGISTRY_USERNAME?: string;

  @ValidateIf((o: EnvironmentVariables) => o.DOCKER_PUBLISH && isDockerHub(o.IMAGE_REGISTRY))
  @IsString()
  @IsNotEmpty()
  IMAGE_REGISTRY_TOKEN?: string;

  @IsOptional()
  @IsString()
  IMAGE_REGISTRY?: string;

  @Transform(toBool)
  @IsBoolean()
  RULE_PIPELINE_ENABLED = false;
}
const IMAGE_REGISTRY_PROPS = new Set(['IMAGE_NAMESPACE', 'IMAGE_REGISTRY_USERNAME', 'IMAGE_REGISTRY_TOKEN']);
const logger = new Logger('EnvValidation');

export const validate = (config: Record<string, unknown>): EnvironmentVariables => {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  // Image registry setting errors are non-fatal: DockerHubService will start in
  // a disabled state and every /simulation-studio/* route returns 503. Any
  // other validation error still aborts boot.
  const blocking = errors.filter(({ property }) => !IMAGE_REGISTRY_PROPS.has(property));
  if (blocking.length > 0) {
    throw new Error(blocking.toString());
  }
  const registryErrors = errors.filter(({ property }) => IMAGE_REGISTRY_PROPS.has(property));
  if (registryErrors.length > 0) {
    logger.warn(
      `DOCKER_PUBLISH=true but the image registry settings are incomplete (${registryErrors.map((e) => e.property).join(', ')}); publishing will remain disabled at runtime.`,
    );
  }
  return validatedConfig;
};
