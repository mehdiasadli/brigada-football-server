import { createZodDto } from 'nestjs-zod';
import { userSchema } from 'src/users/entities/user.entity';

export const forgotPasswordSchema = userSchema.pick({
  email: true,
});

export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
