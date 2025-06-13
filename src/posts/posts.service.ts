import { Injectable, NotFoundException } from '@nestjs/common';
import { FriendshipsService } from 'src/friendships/friendships.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UsersService } from 'src/users/users.service';
import {
  PaginationBuilder,
  PaginationDto,
} from 'src/_common/lib/query.pagination';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly friendshipsService: FriendshipsService,
  ) {}

  async getPostsOfUser(userId: string) {
    const user = await this.usersService.getOneById(userId);
    const posts = await this.prisma.post.findMany({
      where: {
        authorId: user.id,
      },
    });

    return posts;
  }

  async getPostById(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async getPostsForFeed(currentUserId: string, paginationDto: PaginationDto) {
    const pagination = new PaginationBuilder(paginationDto);

    const friends =
      await this.friendshipsService.getFriendsOfUser(currentUserId);

    const friendIds = friends.map((friend) => friend.id);

    const [posts, total] = await Promise.all([
      await this.prisma.post.findMany({
        ...pagination.use(),
        where: {
          OR: [{ authorId: currentUserId }, { authorId: { in: friendIds } }],
        },
        include: {
          _count: {
            select: {
              comments: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          attachments: {
            select: {
              attachedPost: true,
              comment: true,
              match: true,
              venue: true,
              team: true,
              player: true,
            },
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              username: true,
            },
          },
        },
      }),
      await this.prisma.post.count({
        where: {
          OR: [{ authorId: currentUserId }, { authorId: { in: friendIds } }],
        },
      }),
    ]);

    return { posts, total };
  }

  async createPost(createPostDto: CreatePostDto, currentUserId: string) {
    const post = await this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId: currentUserId,
      },
    });

    return post;
  }

  async deletePost(postId: string) {
    await this.prisma.post.delete({
      where: {
        id: postId,
      },
    });
  }
}
