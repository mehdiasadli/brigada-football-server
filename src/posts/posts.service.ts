import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { OrderBuilder, OrderDto } from 'src/_common/lib/query.order';
import { PollsService } from 'src/polls/polls.service';
import { PollDto } from 'src/polls/entities/poll.entity';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly friendshipsService: FriendshipsService,
    @Inject(forwardRef(() => PollsService))
    private readonly pollsService: PollsService,
  ) {}

  async getPostCountOfUser(userId: string) {
    return this.prisma.post.count({
      where: {
        authorId: userId,
      },
    });
  }

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

  async findMany(paginationDto: PaginationDto, orderDto: OrderDto) {
    const pagination = new PaginationBuilder(paginationDto);
    const order = new OrderBuilder(orderDto);

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        ...pagination.use(),
        orderBy: order.use(),
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
          poll: {
            select: {
              id: true,
              content: true,
              _count: {
                select: {
                  options: true,
                },
              },
            },
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
              username: true,
            },
          },
        },
      }),
      this.prisma.post.count(),
    ]);

    return pagination.paginate(posts, total);
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
          poll: {
            select: {
              id: true,
              content: true,
              _count: {
                select: {
                  options: true,
                },
              },
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

  async findOne(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    return post;
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
        poll: {
          select: {
            id: true,
            content: true,
            isAnonymous: true,
            maxVotes: true,
            options: {
              select: {
                id: true,
                _count: {
                  select: {
                    votes: true,
                  },
                },
                content: true,
                image: true,
                votes: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
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
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // check user has voted on the poll
    // if so, which options
    const userVotes =
      post.poll === null
        ? []
        : post.poll.options
            .filter((option) =>
              option.votes.some((vote) => vote.userId === currentUserId),
            )
            .map((option) => option.id);

    return { ...post, poll: { ...post.poll, userVotes } };
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
          poll: {
            select: {
              id: true,
              content: true,
              _count: {
                select: {
                  options: true,
                },
              },
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
    const { poll, ...data } = createPostDto;

    if (isPinned) {
      await this.prisma.post.updateMany({
        where: { authorId: currentUserId, isPinned: true },
        data: { isPinned: false },
      });
    }

    const post = await this.prisma.post.create({
      data: {
        ...data,
        authorId: currentUserId,
      },
    });

    let postPoll: PollDto | null = null;

    if (poll) {
      postPoll = await this.pollsService.create(poll, post.id);
    }

    return { ...post, poll: postPoll };
  }

  async deletePost(postId: string) {
    await this.prisma.post.delete({
      where: {
        id: postId,
      },
    });
  }
}
