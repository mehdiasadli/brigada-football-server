import { HttpException, NotFoundException } from '@nestjs/common';

export function check<T>(
  data: T | null,
  error: string | HttpException = 'Not found',
): T {
  if (!data) {
    if (typeof error === 'string') {
      throw new NotFoundException(error);
    }

    throw error;
  }

  return data as T;
}
