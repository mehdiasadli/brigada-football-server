import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';
import { MESSAGE_KEY } from '../decorators/message.decorator';

// Standard API response interface
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
  path?: string;
  statusCode?: number;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  private getDefaultMessage(method: string, statusCode: number): string {
    // Default messages based on HTTP method and status code
    if (statusCode >= 200 && statusCode < 300) {
      switch (method.toUpperCase()) {
        case 'GET':
          return 'Data retrieved successfully';
        case 'POST':
          return 'Resource created successfully';
        case 'PUT':
        case 'PATCH':
          return 'Resource updated successfully';
        case 'DELETE':
          return 'Resource deleted successfully';
        default:
          return 'Operation completed successfully';
      }
    }

    return 'Success';
  }

  private isAlreadyWrapped(data: any): data is ApiResponse {
    return (
      data &&
      typeof data === 'object' &&
      'data' in data &&
      'message' in data &&
      'success' in data
    );
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const message =
      this.reflector.getAllAndOverride<string>(MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || this.getDefaultMessage(req.method, res.statusCode);

    return next.handle().pipe(
      map((data) => {
        if (this.isAlreadyWrapped(data)) {
          return {
            ...data,
            message,
          };
        }

        const wrappedResponse: ApiResponse<T> = {
          data,
          message,
          success: true,
          timestamp: new Date().toISOString(),
          path: req.url,
          statusCode: res.statusCode,
        };

        return wrappedResponse;
      }),
    );
  }
}
