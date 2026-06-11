import { applyDecorators, type Type } from '@nestjs/common';
import { ApiOperation, ApiResponse, type ApiResponseOptions, type ApiOperationOptions } from '@nestjs/swagger';

// Type alias for Swagger-compatible response types
type SwaggerType = string | Type<unknown> | [Type<unknown>] | (new (...args: unknown[]) => unknown);

export interface SwaggerDecoratorOptions {
  summary: string;
  description?: string;
  responses?: Record<
    number,
    {
      description: string;
      type?: SwaggerType;
    }
  >;
}

/**
 * Custom Swagger decorator that combines ApiOperation and common ApiResponse decorators
 * Automatically includes standard 401 and 403 responses for authenticated endpoints
 * @param options - Configuration options for the API documentation
 */
export const ApiSwagger = (options: SwaggerDecoratorOptions): ReturnType<typeof applyDecorators> => {
  const decorators: Array<MethodDecorator | ClassDecorator> = [];

  // Add ApiOperation
  const operationOptions: ApiOperationOptions = {
    summary: options.summary,
  };

  if (options.description) {
    operationOptions.description = options.description;
  }

  decorators.push(ApiOperation(operationOptions));

  // Add ApiResponse decorators
  if (options.responses) {
    Object.entries(options.responses).forEach(([statusCode, responseConfig]) => {
      const responseOptions: ApiResponseOptions = {
        status: parseInt(statusCode, 10),
        description: responseConfig.description,
      };

      if (responseConfig.type) {
        responseOptions.type = responseConfig.type;
      }

      decorators.push(ApiResponse(responseOptions));
    });
  }

  // Always add standard authentication-related responses
  decorators.push(
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
    }),
  );

  return applyDecorators(...decorators);
};

/**
 * Predefined common response configurations
 */
export const CommonResponses = {
  SUCCESS_200: (type?: SwaggerType, description = 'Operation completed successfully') => ({
    200: { description, type },
  }),
  CREATED_201: (type?: SwaggerType, description = 'Resource created successfully') => ({
    201: { description, type },
  }),
  BAD_REQUEST_400: (description = 'Invalid input data') => ({
    400: { description },
  }),
  NOT_FOUND_404: (description = 'Resource not found') => ({
    404: { description },
  }),
  SUCCESS_201: (type?: SwaggerType, description = 'Resource created successfully') => ({
    201: { description, type },
  }),
} as const;

/**
 * Helper function to merge multiple response configurations
 */
export const mergeResponses = (
  ...responses: Array<Record<number, { description: string; type?: SwaggerType }>>
): Record<number, { description: string; type?: SwaggerType }> => responses.reduce((acc, curr) => ({ ...acc, ...curr }), {});
