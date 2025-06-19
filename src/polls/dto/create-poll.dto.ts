import { createZodDto } from 'nestjs-zod';
import { pollSchema } from '../entities/poll.entity';

export const createPollSchema = pollSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  postId: true,
});

export class CreatePollDto extends createZodDto(createPollSchema) {}
