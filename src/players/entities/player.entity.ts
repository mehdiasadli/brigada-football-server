import { PlayerPosition } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { nameSchema } from 'src/_common/schemas';
import { z } from 'zod';

export const playerSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  teamId: z.string().uuid(),
  userId: z.string().uuid().nullish(),
  name: nameSchema('Player name'),
  isCaptain: z.boolean().default(false),
  positions: z.array(z.nativeEnum(PlayerPosition)),
  goals: z.number().int().nonnegative().default(0),
  assists: z.number().int().nonnegative().default(0),
  rating: z.number().min(0).max(10).nullish(),
});

export class Player extends createZodDto(playerSchema) {}
