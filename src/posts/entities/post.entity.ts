import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PostVisibility } from '@prisma/client';

export const postSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  editedAt: z.coerce.date().nullish(),
  content: z.string(),
  images: z.array(z.string()),
  isPinned: z.boolean().default(false),
  authorId: z.string().uuid(),
  visibility: z.nativeEnum(PostVisibility),
});

export class PostDto extends createZodDto(postSchema) {}
