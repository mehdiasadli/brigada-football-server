import { createZodDto } from 'nestjs-zod';
import { userPreferenceSchema } from '../entities/user-preference.entity';

export const createUserPreferenceSchema = userPreferenceSchema.pick({
  userId: true,
});

export class CreateUserPreferenceDto extends createZodDto(
  createUserPreferenceSchema,
) {}
