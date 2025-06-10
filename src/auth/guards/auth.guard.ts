import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PUBLIC_KEY } from 'src/_common/decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const bearerToken = request.headers.authorization;

    if (!bearerToken) throw new UnauthorizedException('No token provided');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, token] = bearerToken.split(' ');

    if (!token) throw new UnauthorizedException('Invalid token');

    try {
      const decoded = this.jwtService.verify(token) as unknown as {
        sub: string;
      };

      if (!decoded.sub) {
        throw new UnauthorizedException('Invalid token');
      }

      request['user'] = decoded.sub;

      return true;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
