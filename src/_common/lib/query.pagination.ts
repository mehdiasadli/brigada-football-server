import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce
    .number({
      invalid_type_error: 'Page must be a number',
    })
    .int('Page must be an integer')
    .positive('Page must be positive')
    .min(1, 'Page must be greater or equal to 1')
    .default(1),
  limit: z.coerce
    .number({
      invalid_type_error: 'Limit must be a number',
    })
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .min(5, 'Limit must be greater or equal to 5')
    .max(50, 'Limit must be less or equal to 50')
    .default(25),
});

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
  firstPage: number;
  lastPage: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export class PaginationDto extends createZodDto(paginationSchema) {}

export class PaginationBuilder {
  private page: number;
  private limit: number;

  constructor(pagination: PaginationDto) {
    this.page = pagination.page;
    this.limit = pagination.limit;
  }

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  public use() {
    return {
      skip: this.skip,
      take: this.limit,
    } as const;
  }

  public getMeta(totalItems: number): PaginationMeta {
    const totalPages = Math.ceil(totalItems / this.limit);
    const hasNextPage = this.page < totalPages;
    const hasPreviousPage = this.page > 1;

    return {
      page: this.page,
      limit: this.limit,
      totalItems,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? this.page + 1 : null,
      previousPage: hasPreviousPage ? this.page - 1 : null,
      firstPage: 1,
      lastPage: totalPages,
    };
  }

  public paginate<T>(items: T[], totalItems: number): PaginatedResult<T> {
    return {
      items,
      meta: this.getMeta(totalItems),
    };
  }
}
