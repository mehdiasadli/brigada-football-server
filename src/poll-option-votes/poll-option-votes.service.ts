import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PollsService } from 'src/polls/polls.service';

@Injectable()
export class PollOptionVotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pollsService: PollsService,
  ) {}

  async getVote(optionId: string, userId: string) {
    return await this.prisma.pollOptionVote.findUnique({
      where: {
        optionId_userId: {
          optionId,
          userId,
        },
      },
    });
  }

  async getVotesOfUser(userId: string) {
    return await this.prisma.pollOptionVote.findMany({
      where: {
        userId,
      },
    });
  }

  async getVotesOfUserForPoll(userId: string, pollId: string) {
    return await this.prisma.pollOptionVote.findMany({
      where: {
        userId,
        option: {
          pollId,
        },
      },
    });
  }

  async getVotesOfOption(optionId: string) {
    return await this.prisma.pollOptionVote.findMany({
      where: {
        optionId,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  async create(optionId: string, userId: string) {
    const existingVote = await this.getVote(optionId, userId);

    if (existingVote) {
      throw new BadRequestException('You have already voted for this option');
    }

    const poll = await this.pollsService.findPollFromOption(optionId);

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.maxVotes === 0) {
      throw new BadRequestException('This poll has no max votes');
    }

    const userVotes = await this.getVotesOfUserForPoll(userId, poll.id);

    if (userVotes.length >= poll.maxVotes) {
      throw new BadRequestException(
        'You have reached the maximum number of votes for this poll',
      );
    }

    return await this.prisma.pollOptionVote.create({
      data: {
        optionId,
        userId,
      },
    });
  }
}
