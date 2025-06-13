import { faker } from '@faker-js/faker';
import { PostVisibility } from '@prisma/client';
import { CreatePostDto } from 'src/posts/dto/create-post.dto';

const Visibility = [
  PostVisibility.PUBLIC,
  PostVisibility.PRIVATE,
  PostVisibility.FRIENDS,
] as const;

export const createMockPosts = (count: number): CreatePostDto[] => {
  return Array.from({ length: count }, () => {
    return {
      content: faker.lorem.paragraph(),
      images: [],
      isPinned: false,
      visibility: faker.helpers.arrayElement(Visibility),
    };
  });
};
