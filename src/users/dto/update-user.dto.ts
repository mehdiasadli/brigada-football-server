import { z } from 'zod';
import { userSchema } from '../entities/user.entity';
import { createZodDto } from 'nestjs-zod';

export const updateUserSchema = userSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const updateRoleSchema = updateUserSchema.required().pick({
  role: true,
});

export const updateUserPasswordSchema = updateUserSchema
  .required()
  .pick({
    password: true,
  })
  .merge(
    z.object({
      confirmPassword: z.string(),
      currentPassword: z.string(),
    }),
  )
  .superRefine((arg, ctx) => {
    if (arg.password !== arg.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });

      return z.NEVER;
    }
  });

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
export class UpdateUserPasswordDto extends createZodDto(
  updateUserPasswordSchema,
) {}
export class UpdateRoleDto extends createZodDto(updateRoleSchema) {}
