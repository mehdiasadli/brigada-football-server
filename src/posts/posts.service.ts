import { Injectable, NotFoundException } from '@nestjs/common';
import { FriendshipsService } from 'src/friendships/friendships.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UsersService } from 'src/users/users.service';
import {
  PaginationBuilder,
  PaginationDto,
} from 'src/_common/lib/query.pagination';
import { createMockPosts } from 'src/_common/mock/posts';
import { PostVisibility } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly friendshipsService: FriendshipsService,
  ) {}

  async globalSearch(query: string, currentUserId: string) {
    const friends =
      await this.friendshipsService.getFriendsOfUser(currentUserId);
    const friendIds = friends.map((friend) => friend.id);

    const posts = await this.prisma.post.findMany({
      where: {
        AND: [
          {
            content: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            OR: [
              { visibility: PostVisibility.PUBLIC },
              { authorId: currentUserId },
              {
                authorId: { in: friendIds },
                visibility: { not: PostVisibility.PRIVATE },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
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
      take: 3,
    });

    return posts.map((post) => ({
      item: post,
      type: 'post' as const,
    }));
  }

  async getPostsStats() {
    const totalPosts = await this.prisma.post.count();

    const postsInThisMonth = await this.prisma.post.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    const postsInLastMonth = await this.prisma.post.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 2)),
          lte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    return {
      totalPosts,
      postsInThisMonth,
      postsInLastMonth,
    };
  }

  async getPostsChart() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const startDate = new Date(currentYear - 1, currentMonth - 1, 1);
    const endDate = new Date(
      currentYear,
      currentMonth - 1,
      now.getDate(),
      23,
      59,
      59,
    );

    const postsCreated = await this.prisma.post.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    // active post = post with comments
    const activePosts = await this.prisma.post.findMany({
      where: {
        comments: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    const monthlyData: any[] = [];

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - 1 - i, 1);
      const targetMonth = targetDate.getMonth() + 1; // Convert to 1-12
      const targetYear = targetDate.getFullYear();

      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59); // Last day of month

      const postsCreatedCount = postsCreated.filter((post) => {
        const postCreatedAt = new Date(post.createdAt);
        return postCreatedAt >= monthStart && postCreatedAt <= monthEnd;
      }).length;

      const activePostsCount = activePosts.filter((post) => {
        const postCreatedAt = new Date(post.createdAt);
        return postCreatedAt >= monthStart && postCreatedAt <= monthEnd;
      }).length;

      monthlyData.push({
        month: targetMonth,
        postsCreatedCount,
        activePostsCount,
      });
    }

    return monthlyData;
  }

  async getPostsOfUser(
    username: string,
    currentUserId: string,
    paginationDto: PaginationDto,
  ) {
    const friends =
      await this.friendshipsService.getFriendsOfUser(currentUserId);
    const friendIds = friends.map((friend) => friend.id);

    const user = await this.usersService.getOneByUsername(
      username,
      currentUserId,
    );
    const pagination = new PaginationBuilder(paginationDto);

    const [posts, total] = await Promise.all([
      await this.prisma.post.findMany({
        ...pagination.use(),
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        where: {
          authorId: user.id,
          OR: [
            { visibility: PostVisibility.PUBLIC },
            { authorId: currentUserId },
            {
              authorId: { in: friendIds },
              visibility: { not: PostVisibility.PRIVATE },
            },
          ],
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
          attachments: true,
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
          authorId: user.id,
          OR: [
            { visibility: PostVisibility.PUBLIC },
            { authorId: currentUserId },
            {
              authorId: { in: friendIds },
              visibility: { not: PostVisibility.PRIVATE },
            },
          ],
        },
      }),
    ]);

    return pagination.paginate(posts, total);
  }

  async getPostById(postId: string, currentUserId: string) {
    const friends =
      await this.friendshipsService.getFriendsOfUser(currentUserId);
    const friendIds = friends.map((friend) => friend.id);

    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
        OR: [
          { visibility: PostVisibility.PUBLIC },
          { authorId: currentUserId },
          {
            authorId: { in: friendIds },
            visibility: { not: PostVisibility.PRIVATE },
          },
        ],
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
        attachments: true,
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
          OR: [
            { visibility: PostVisibility.PUBLIC },
            { authorId: currentUserId },
            {
              authorId: { in: friendIds },
              visibility: { not: PostVisibility.PRIVATE },
            },
          ],
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
          OR: [
            { visibility: PostVisibility.PUBLIC },
            { authorId: currentUserId },
            {
              authorId: { in: friendIds },
              visibility: { not: PostVisibility.PRIVATE },
            },
          ],
        },
      }),
    ]);

    return { posts, total };
  }

  async createMock(count: number, authorId: string) {
    const posts = createMockPosts(count);

    return await Promise.all(
      posts.map((post) => this.createPost(post, authorId)),
    );
  }

  async createPost(createPostDto: CreatePostDto, currentUserId: string) {
    const { isPinned } = createPostDto;

    if (isPinned) {
      await this.prisma.post.updateMany({
        where: { authorId: currentUserId, isPinned: true },
        data: { isPinned: false },
      });
    }

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
