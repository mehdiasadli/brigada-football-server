import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const userId = req['user'] as string;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return userId;
  },
);
