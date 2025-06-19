import { createZodDto } from 'nestjs-zod';
import { pollOptionSchema } from '../entities/poll-option.entity';

export const createPollOptionSchema = pollOptionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  pollId: true,
});

export class CreatePollOptionDto extends createZodDto(createPollOptionSchema) {}
