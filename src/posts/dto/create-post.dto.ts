import { createZodDto } from 'nestjs-zod';
import { postSchema } from '../entities/post.entity';

export const createPostSchema = postSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
  authorId: true,
});

export class CreatePostDto extends createZodDto(createPostSchema) {}
