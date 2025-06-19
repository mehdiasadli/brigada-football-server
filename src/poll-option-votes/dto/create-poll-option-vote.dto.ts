import { createZodDto } from 'nestjs-zod';
import { pollOptionVoteSchema } from '../entities/poll-option-vote.entity';

export const createPollOptionVoteSchema = pollOptionVoteSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export class CreatePollOptionVoteDto extends createZodDto(
  createPollOptionVoteSchema,
) {}
