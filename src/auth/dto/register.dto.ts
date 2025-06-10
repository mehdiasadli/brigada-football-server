import { createZodDto } from 'nestjs-zod';
import { createUserSchema } from 'src/users/dto/create-user.dto';
import { z } from 'zod';

export const registerSchema = createUserSchema
  .merge(
    z.object({
      confirmPassword: z.string({
        required_error: 'Confirm password is required',
        invalid_type_error: 'Confirm password must be a string',
      }),
    }),
  )
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

export class RegisterDto extends createZodDto(registerSchema) {}
