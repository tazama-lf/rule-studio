import { plainToClass, Transform } from 'class-transformer';
import { IsEnum, IsString, IsNumberString, IsBoolean, IsNotEmpty, ValidateIf, validateSync } from 'class-validator';

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
export const validate = (config: Record<string, unknown>): EnvironmentVariables => {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
};
