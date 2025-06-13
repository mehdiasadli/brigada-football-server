import { postSchema } from '../entities/post.entity';
import { createZodDto } from 'nestjs-zod';

export const updatePostSchema = postSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
  authorId: true,
});

export class UpdatePostDto extends createZodDto(updatePostSchema) {}
