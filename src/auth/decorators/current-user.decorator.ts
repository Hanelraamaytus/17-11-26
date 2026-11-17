import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../types/jwt-payload.type.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);