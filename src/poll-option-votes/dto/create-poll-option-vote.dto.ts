import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPollOptionVoteSchema = z.object({
  optionIds: z.array(z.string().uuid()).min(1),
});

export class CreatePollOptionVoteDto extends createZodDto(
  createPollOptionVoteSchema,
) {}
