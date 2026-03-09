import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
// Usage example:
// @Get('profile')
// getProfile(@User() user: AuthenticatedUser) {
//   return user;
// }
