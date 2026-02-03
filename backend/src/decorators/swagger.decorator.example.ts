// Example usage of the ApiSwagger decorator

import { Controller, Get, Post, Put, Delete } from '@nestjs/common';
import { ApiSwagger, CommonResponses, mergeResponses } from '../decorators/swagger.decorator';

@Controller('example')
export class ExampleController {

  // Simple usage with just success response
  @Get('simple')
  @ApiSwagger({
    summary: 'Simple endpoint',
    description: 'A simple endpoint that returns success',
    responses: CommonResponses.SUCCESS_200(String, 'Simple response returned')
  })
  async simpleEndpoint(): Promise<string> {
    return 'success';
  }

  // Usage with multiple response types
  @Post('create')
  @ApiSwagger({
    summary: 'Create resource',
    description: 'Creates a new resource',
    responses: mergeResponses(
      CommonResponses.CREATED_201(Object, 'Resource created successfully'),
      CommonResponses.BAD_REQUEST_400('Invalid input data'),
      CommonResponses.NOT_FOUND_404('Related resource not found')
    )
  })
  async createResource(): Promise<any> {
    return {};
  }

  // Usage with custom response
  @Get('custom')
  @ApiSwagger({
    summary: 'Custom responses',
    description: 'Endpoint with custom response configurations',
    responses: {
      200: { description: 'Custom success message', type: Array },
      422: { description: 'Unprocessable entity' },
      500: { description: 'Internal server error' }
    }
  })
  async customResponses(): Promise<any[]> {
    return [];
  }

  // Usage combining common and custom responses
  @Put('update/:id')
  @ApiSwagger({
    summary: 'Update resource',
    description: 'Updates an existing resource',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Object, 'Resource updated successfully'),
      CommonResponses.NOT_FOUND_404('Resource not found'),
      { 422: { description: 'Validation failed' } }
    )
  })
  async updateResource(): Promise<any> {
    return {};
  }

  // Minimal usage - only summary required, 401/403 added automatically
  @Delete(':id')
  @ApiSwagger({
    summary: 'Delete resource',
    responses: mergeResponses(
      { 204: { description: 'Resource deleted successfully' } },
      CommonResponses.NOT_FOUND_404('Resource not found')
    )
  })
  async deleteResource(): Promise<void> {
    // implementation
  }
}