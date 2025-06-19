import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { PostsService } from 'src/posts/posts.service';

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PostsService))
    private readonly postsService: PostsService,
  ) {}

  async findOne(pollId: string) {
    return await this.prisma.poll.findUnique({
      where: {
        id: pollId,
      },
    });
  }

  async findPollOfPost(postId: string) {
    return await this.prisma.poll.findUnique({
      where: {
        postId,
      },
    });
  }

  async findPollFromOption(optionId: string) {
    return await this.prisma.poll.findFirst({
      where: {
        options: {
          some: {
            id: optionId,
          },
        },
      },
    });
  }

  async create(createPollDto: CreatePollDto, postId: string) {
    const post = await this.postsService.findOne(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return await this.prisma.poll.create({
      data: {
        ...createPollDto,
        postId,
      },
    });
  }
}
