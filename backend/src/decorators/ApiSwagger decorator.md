# ApiSwagger Decorator

A centralized Swagger decorator that combines multiple Swagger decorators to reduce code duplication and improve maintainability.

## Features

- **Combines ApiOperation and ApiResponse**: Single decorator replaces multiple decorators
- **Automatic authentication responses**: Always includes 401 (Unauthorized) and 403 (Forbidden) responses
- **Predefined common responses**: Helper functions for common HTTP status codes
- **Flexible response merging**: Easy to combine common and custom responses
- **Type-safe**: Full TypeScript support with proper types

## Usage

### Basic Usage

```typescript
import { ApiSwagger, CommonResponses } from './swagger.decorator';

@Get('/users')
@ApiSwagger({
  summary: 'Get all users',
  description: 'Retrieves a list of all users',
  responses: CommonResponses.SUCCESS_200([User], 'Users retrieved successfully')
})
async getUsers(): Promise<User[]> {
  return this.userService.getAllUsers();
}
```

### Multiple Response Types

```typescript
@Post('/users')
@ApiSwagger({
  summary: 'Create user',
  description: 'Creates a new user account',
  responses: mergeResponses(
    CommonResponses.CREATED_201(User, 'User created successfully'),
    CommonResponses.BAD_REQUEST_400('Invalid user data'),
    CommonResponses.NOT_FOUND_404('Department not found')
  )
})
async createUser(@Body() userData: CreateUserDto): Promise<User> {
  return this.userService.create(userData);
}
```

### Custom Responses

```typescript
@Get('/stats')
@ApiSwagger({
  summary: 'Get statistics',
  description: 'Returns application statistics',
  responses: {
    200: { description: 'Statistics retrieved', type: StatsDto },
    202: { description: 'Statistics being calculated' },
    503: { description: 'Statistics service unavailable' }
  }
})
async getStats(): Promise<StatsDto> {
  return this.statsService.getStats();
}
```

## API Reference

### ApiSwagger(options)

Main decorator that combines ApiOperation and ApiResponse decorators.

**Parameters:**
- `options.summary` (string, required): Brief description of the endpoint
- `options.description` (string, optional): Detailed description of the endpoint
- `options.responses` (object, optional): Response configurations

### CommonResponses

Predefined response configurations for common HTTP status codes:

- `SUCCESS_200(type?, description?)`: 200 OK response
- `CREATED_201(type?, description?)`: 201 Created response
- `BAD_REQUEST_400(description?)`: 400 Bad Request response
- `NOT_FOUND_404(description?)`: 404 Not Found response

### mergeResponses(...responses)

Helper function to combine multiple response configurations:

```typescript
mergeResponses(
  CommonResponses.SUCCESS_200(User),
  CommonResponses.BAD_REQUEST_400(),
  { 422: { description: 'Validation failed' } }
)
```

## Automatic Responses

All endpoints decorated with `@ApiSwagger` automatically include:

- **401 Unauthorized**: "Invalid or missing JWT token"
- **403 Forbidden**: "Insufficient permissions"

## Migration from Old Decorators

### Before:
```typescript
@ApiOperation({
  summary: 'Get user by ID',
  description: 'Retrieves a specific user by their ID'
})
@ApiResponse({
  status: 200,
  description: 'User retrieved successfully',
  type: User
})
@ApiResponse({
  status: 404,
  description: 'User not found'
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid or missing JWT token'
})
@ApiResponse({
  status: 403,
  description: 'Forbidden - Insufficient permissions'
})
```

### After:
```typescript
@ApiSwagger({
  summary: 'Get user by ID',
  description: 'Retrieves a specific user by their ID',
  responses: mergeResponses(
    CommonResponses.SUCCESS_200(User, 'User retrieved successfully'),
    CommonResponses.NOT_FOUND_404('User not found')
  )
})
```

## Benefits

1. **Reduced boilerplate**: ~70% reduction in decorator lines
2. **Consistency**: Standardized response formats across endpoints
3. **Maintainability**: Central place to update common responses
4. **Type safety**: Full TypeScript support with IntelliSense
5. **Flexibility**: Easy to add custom responses when needed