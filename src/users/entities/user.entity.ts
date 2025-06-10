import { z } from 'zod';
import { UserRole, Gender } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { regexes } from 'src/_common/resources/regexes';
import { nameSchema } from 'src/_common/schemas';
import { appConfig } from 'src/_common/config';

const passwordSpecialChars = process.env.PASSWORD_SPECIAL_CHARS!;

export const userSchema = z.object({
  id: z
    .string({
      required_error: 'Id is required',
      invalid_type_error: 'Id must be a string',
    })
    .uuid({
      message: 'Invalid id',
    }),
  createdAt: z.coerce.date({
    required_error: 'Created at is required',
    invalid_type_error: 'Created at must be a date',
  }),
  updatedAt: z.coerce.date({
    required_error: 'Updated at is required',
    invalid_type_error: 'Updated at must be a date',
  }),
  deletedAt: z.coerce
    .date({
      required_error: 'Deleted at is required',
      invalid_type_error: 'Deleted at must be a date',
    })
    .nullable(),
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email({
      message: 'Invalid email',
    }),
  username: z
    .string({
      required_error: 'Username is required',
      invalid_type_error: 'Username must be a string',
    })
    .regex(regexes.users.username, {
      message: 'Invalid username',
    })
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .transform((val) => val.toLowerCase()),
  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string',
    })
    .regex(regexes.users.password, {
      message: `Invalid password. Password must include at least one lowercase letter, one uppercase letter, one number, and one special character. (${passwordSpecialChars})`,
    })
    .min(8, 'Password must be at least 8 characters')
    .max(32, 'Password must be less than 32 characters'),
  firstName: nameSchema('First name'),
  lastName: nameSchema('Last name'),
  avatar: z
    .string({
      required_error: 'Avatar is required',
      invalid_type_error: 'Avatar must be a string',
    })
    .url({
      message: 'Invalid avatar',
    })
    .nullable(),
  mobileNumber: z
    .string({
      required_error: 'Mobile number is required',
      invalid_type_error: 'Mobile number must be a string',
    })
    .regex(regexes.users.mobileNumber, {
      message: 'Invalid mobile number',
    }),
  role: z.nativeEnum(UserRole, {
    required_error: 'Role is required',
    invalid_type_error: 'Role must be a string',
    message: 'Invalid role',
  }),
  dateOfBirth: z.coerce
    .date({
      required_error: 'Date of birth is required',
      invalid_type_error: 'Date of birth must be a date',
    })
    .refine(
      (val) => {
        const [minAge, maxAge] = appConfig.DOB_AGE_RANGE;
        const age = new Date().getFullYear() - val.getFullYear();
        return age >= minAge && age <= maxAge;
      },
      {
        message: 'Invalid date of birth',
      },
    ),
  gender: z.nativeEnum(Gender, {
    required_error: 'Gender is required',
    invalid_type_error: 'Gender must be a string',
    message: 'Invalid gender',
  }),
  placeOfBirth: z.string({
    required_error: 'Place of birth is required',
    invalid_type_error: 'Place of birth must be a string',
  }),
  emailVerifiedAt: z.coerce
    .date({
      required_error: 'Email verified at is required',
      invalid_type_error: 'Email verified at must be a date',
    })
    .nullish(),
  invalidPasswordAttempts: z
    .number({
      required_error: 'Invalid password attempts is required',
      invalid_type_error: 'Invalid password attempts must be a number',
    })
    .int({
      message: 'Invalid password attempts',
    }),
});

export class UserDto extends createZodDto(userSchema) {}
