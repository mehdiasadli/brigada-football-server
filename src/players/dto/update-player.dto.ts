import { createZodDto } from 'nestjs-zod';
import { playerSchema } from '../entities/player.entity';

export const updatePlayerSchema = playerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  teamId: true,
});

export class UpdatePlayerDto extends createZodDto(updatePlayerSchema) {}
