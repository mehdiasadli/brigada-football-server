import { createZodDto } from 'nestjs-zod';
import { postSchema } from '../entities/post.entity';
import { z } from 'zod';
import { createPollSchema } from 'src/polls/dto/create-poll.dto';

export const createPostSchema = postSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    editedAt: true,
    authorId: true,
  })
  .merge(
    z.object({
      poll: createPollSchema.nullable(),
    }),
  );

export class CreatePostDto extends createZodDto(createPostSchema) {}
