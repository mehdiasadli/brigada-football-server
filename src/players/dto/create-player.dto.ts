import { createZodDto } from 'nestjs-zod';
import { playerSchema } from '../entities/player.entity';

export const createPlayerSchema = playerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  teamId: true,
});

export class CreatePlayerDto extends createZodDto(createPlayerSchema) {}
