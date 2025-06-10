import { createZodDto } from 'nestjs-zod';
import { userSchema } from 'src/users/entities/user.entity';

export const resendVerificationEmailSchema = userSchema.pick({
  email: true,
});

export class ResendVerificationEmailDto extends createZodDto(
  resendVerificationEmailSchema,
) {}
