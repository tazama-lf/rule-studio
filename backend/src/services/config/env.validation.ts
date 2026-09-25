import { plainToClass, Transform } from 'class-transformer';
import { IsEnum, IsString, IsNumberString, IsBoolean, IsNotEmpty, ValidateIf, validateSync } from 'class-validator';
import { Logger } from '@nestjs/common';

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
  // SimStudio surface are disabled and the DOCKERHUB_* trio is not required.
  // When true, the trio below is required.
  @Transform(toBool)
  @IsBoolean()
  DOCKER_PUBLISH = false;

  @ValidateIf((o: EnvironmentVariables) => o.DOCKER_PUBLISH)
  @IsString()
  @IsNotEmpty()
  DOCKERHUB_TOKEN?: string;

  @ValidateIf((o: EnvironmentVariables) => o.DOCKER_PUBLISH)
  @IsString()
  @IsNotEmpty()
  DOCKERHUB_USERNAME?: string;

  @ValidateIf((o: EnvironmentVariables) => o.DOCKER_PUBLISH)
  @IsString()
  @IsNotEmpty()
  DOCKERHUB_NAMESPACE?: string;
}
const DOCKER_HUB_PROPS = new Set(['DOCKERHUB_TOKEN', 'DOCKERHUB_USERNAME', 'DOCKERHUB_NAMESPACE']);
const logger = new Logger('EnvValidation');

export const validate = (config: Record<string, unknown>): EnvironmentVariables => {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  // Docker Hub credential errors are non-fatal: DockerHubService will start in
  // a disabled state and every /simulation-studio/* route returns 503. Any
  // other validation error still aborts boot.
  const blocking = errors.filter(({ property }) => !DOCKER_HUB_PROPS.has(property));
  if (blocking.length > 0) {
    throw new Error(blocking.toString());
  }
  const dockerHubErrors = errors.filter(({ property }) => DOCKER_HUB_PROPS.has(property));
  if (dockerHubErrors.length > 0) {
    logger.warn(
      `DOCKER_PUBLISH=true but Docker Hub credentials are incomplete (${dockerHubErrors.map((e) => e.property).join(', ')}); publishing will remain disabled at runtime.`,
    );
  }
  return validatedConfig;
};
