import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PlayerPosition } from '@prisma/client';

export const userPreferenceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  preferredPositions: z.array(z.nativeEnum(PlayerPosition)),
  notifications: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
});

export class UserPreferenceEntity extends createZodDto(userPreferenceSchema) {}
