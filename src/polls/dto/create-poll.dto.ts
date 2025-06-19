import { createZodDto } from 'nestjs-zod';
import { pollSchema } from '../entities/poll.entity';
import { z } from 'zod';
import { createPollOptionSchema } from 'src/poll-options/dto/create-poll-option.dto';

export const createPollSchema = pollSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    postId: true,
  })
  .merge(
    z.object({
      options: z
        .array(createPollOptionSchema)
        .min(2, 'At least 2 options are required'),
    }),
  );

export class CreatePollDto extends createZodDto(createPollSchema) {}
