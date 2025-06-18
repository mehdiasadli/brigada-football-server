import { createZodDto } from 'nestjs-zod';
import { commentSchema } from '../entities/comment.entity';

export const createCommentSchema = commentSchema.omit({
  id: true,
  createdAt: true,
  editedAt: true,
  updatedAt: true,
  authorId: true,
  postId: true,
});

export class CreateCommentDto extends createZodDto(createCommentSchema) {}
