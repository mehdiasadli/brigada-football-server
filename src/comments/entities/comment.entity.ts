import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const commentSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.date(),
  editedAt: z.date().nullish(),
  updatedAt: z.date(),
  postId: z.string(),
  authorId: z.string(),
});

export class CommentDto extends createZodDto(commentSchema) {}
