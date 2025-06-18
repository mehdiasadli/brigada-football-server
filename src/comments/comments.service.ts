import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UsersService } from 'src/users/users.service';
import { PostsService } from 'src/posts/posts.service';
import {
  PaginationBuilder,
  PaginationDto,
} from 'src/_common/lib/query.pagination';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  async getCommentCountOfUser(userId: string) {
    return this.prisma.comment.count({
      where: {
        authorId: userId,
      },
    });
  }

  async findOne(commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      include: {
        post: true,
        author: true,
      },
    });

    return comment;
  }

  async create(
    createCommentDto: CreateCommentDto,
    postId: string,
    currentUserId: string,
  ) {
    const post = await this.postsService.findOne(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        ...createCommentDto,
        authorId: currentUserId,
        postId,
      },
    });

    return comment;
  }

  async delete(commentId: string, currentUserId: string) {
    const comment = await this.findOne(commentId);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    const postAuthor = await this.usersService.findOne(comment.post.authorId);

    if (
      comment.authorId !== currentUserId &&
      postAuthor?.id !== currentUserId
    ) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });
  }

  async getCommentsOfPost(postId: string, paginationDto: PaginationDto) {
    const pagination = new PaginationBuilder(paginationDto);

    const post = await this.postsService.findOne(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        ...pagination.use(),
        where: {
          postId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          likes: {
            select: {
              userId: true,
            },
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.comment.count({
        where: {
          postId,
        },
      }),
    ]);

    return pagination.paginate(comments, total);
  }
}
