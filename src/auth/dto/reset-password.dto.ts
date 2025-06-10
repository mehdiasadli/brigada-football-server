import { createZodDto } from 'nestjs-zod';
import { userSchema } from 'src/users/entities/user.entity';
import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    token: z.string({
      required_error: 'Token is required',
      invalid_type_error: 'Token must be a string',
    }),
    password: userSchema.shape.password,
    confirmPassword: z.string({
      required_error: 'Confirm password is required',
      invalid_type_error: 'Confirm password must be a string',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });

      return z.NEVER;
    }
  });

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
