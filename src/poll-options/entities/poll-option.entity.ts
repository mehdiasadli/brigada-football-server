import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const pollOptionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  pollId: z.string().uuid(),
  content: z.string().nullable(),
  image: z.string().nullable(),
});

export class PollOptionDto extends createZodDto(pollOptionSchema) {}
