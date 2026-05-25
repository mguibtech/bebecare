import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

// Decorator para extrair o usuário autenticado direto do request no controller.
//
// Uso:
//   @Get('me')
//   me(@CurrentUser() user: User) { ... }
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
});
