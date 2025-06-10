import { createZodDto } from 'nestjs-zod';
import { matchSchema } from '../entities/match.entity';

const updateMatchSchema = matchSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  creatorId: true,
});

export class UpdateMatchDto extends createZodDto(updateMatchSchema) {}
