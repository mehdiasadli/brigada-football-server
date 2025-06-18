import { createZodDto } from 'nestjs-zod';
import { commentSchema } from '../entities/comment.entity';

export const updateCommentSchema = commentSchema
  .omit({
    id: true,
    createdAt: true,
    editedAt: true,
    updatedAt: true,
    authorId: true,
    postId: true,
  })
  .partial();

export class UpdateCommentDto extends createZodDto(updateCommentSchema) {}
