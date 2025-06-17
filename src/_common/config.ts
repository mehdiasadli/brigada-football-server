import { z } from 'zod';

export const configSchema = z.object({
  // Environment variables
  APP_NAME: z.string().default('Brigada Football'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  SALT_ROUNDS: z.coerce.number(),
  MAX_ALLOWED_INVALID_PASSWORD_ATTEMPTS: z.coerce.number(),
  CLIENT_URL: z.string().url(),
  PASSWORD_RESET_TOKEN_EXP_IN_HOURS: z.coerce.number(),
  EMAIL_VERIFICATION_TOKEN_EXP_IN_HOURS: z.coerce.number(),
  MAILJET_API_KEY: z.string(),
  MAILJET_API_SECRET: z.string(),
  MAIL_SENDER_ADDRESS: z.string().email(),
  MAIL_SENDER_NAME: z.string(),
  PASSWORD_SPECIAL_CHARS: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  MOBILE_NUMBER_OPERATORS: z
    .string()
    .regex(/[\d,]+/)
    .min(1)
    .transform((val) => val.split(',').map((operator) => operator.trim())),
  DOB_AGE_RANGE: z
    .string()
    .regex(/^\d+,\d+$/)
    .transform(
      (val) =>
        val
          .split(',')
          .map((age) => age.trim())
          .map((age) => parseInt(age)) as [number, number],
    ),
  THROTTLER_DATA: z
    .string()
    .regex(/^\d+,\d+$/)
    .transform((val) => {
      const [ttl, limit] = val.split(',').map(Number);

      return {
        ttl,
        limit,
      };
    }),
});

export const appConfig = configSchema.parse(process.env);
export type TConfig = z.infer<typeof configSchema>;
