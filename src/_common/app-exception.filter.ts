import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

export interface ErrorResponse {
  status: HttpStatus;
  message: string;
  timestamp: string;
  path: string;
  method: string;
  details: null | {
    databaseError?: {
      code: string;
      clientVersion: string;
      meta: Record<string, any>;
    };
    errors?: {
      path: string;
      message: string;
    }[];
    meta?: Record<string, any>;
  };
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('AppExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let errorResponse: ErrorResponse = {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      details: null,
    };

    this.logger.error(exception);

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      const firstMessage = zodError.errors[0].message;

      errorResponse = {
        ...errorResponse,
        status: HttpStatus.BAD_REQUEST,
        message: firstMessage,
        details: {
          errors: zodError.errors.map((error) => ({
            path: error.path.join('.'),
            message: error.message,
          })),
        },
      };
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse = {
        ...errorResponse,
        status,
        message:
          (exceptionResponse as any).message ||
          exception.message ||
          'An unexpected error occurred',
        details: (exceptionResponse as any).details || null,
      };
    } else if (exception instanceof ZodError) {
      errorResponse = {
        ...errorResponse,
        status: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        details: {
          errors: exception.errors.map((error) => ({
            path: error.path.join('.'),
            message: error.message,
          })),
        },
      };
    } else if (exception instanceof PrismaClientKnownRequestError) {
      errorResponse = {
        ...errorResponse,
        status: HttpStatus.BAD_REQUEST,
        message: 'Database error occured',
        details: {
          databaseError: {
            code: exception.code,
            clientVersion: exception.clientVersion,
            meta: exception.meta || {},
          },
        },
      };
    }

    response.status(errorResponse.status).json(errorResponse);
  }
}
