import { z } from 'zod';

export const nameSchema = (
  field: string,
  params?: z.RawCreateParams & {
    min?: number;
    max?: number;
  },
) => {
  return z
    .string({
      required_error: `${field} is required`,
      invalid_type_error: `${field} must be a string`,
      ...params,
    })
    .min(
      params?.min ?? 1,
      `${field} must be at least ${params?.min ?? 1} character${
        (params?.min ?? 1) > 1 ? 's' : ''
      }`,
    )
    .max(
      params?.max ?? 30,
      `${field} must be less than ${params?.max ?? 30} character${
        (params?.max ?? 30) > 1 ? 's' : ''
      }`,
    );
};
