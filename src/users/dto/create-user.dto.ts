import { createZodDto } from 'nestjs-zod';
import { userSchema } from '../entities/user.entity';

export const createUserSchema = userSchema.pick({
  email: true,
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  mobileNumber: true,
  dateOfBirth: true,
  placeOfBirth: true,
  gender: true,
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
