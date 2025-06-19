import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PollsService } from 'src/polls/polls.service';
import { PollOptionsService } from 'src/poll-options/poll-options.service';
import { CreatePollOptionVoteDto } from './dto/create-poll-option-vote.dto';

@Injectable()
export class PollOptionVotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pollsService: PollsService,
    private readonly pollOptionsService: PollOptionsService,
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

  async vote(createPollOptionVoteDto: CreatePollOptionVoteDto, userId: string) {
    const { optionIds } = createPollOptionVoteDto;

    const poll = await this.pollsService.findPollFromOption(optionIds[0]);

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.maxVotes === 0) {
      throw new BadRequestException('This poll has no max votes');
    }

    if (optionIds.length > poll.maxVotes) {
      throw new BadRequestException(
        `You can only vote for ${poll.maxVotes} options`,
      );
    }

    const votes = await Promise.all(
      optionIds.map(async (optionId) => await this.create(optionId, userId)),
    );

    const options = await this.pollOptionsService.getOptionsOfPoll(poll.id);

    return { votes, options };
  }

  async create(optionId: string, userId: string) {
    const existingVote = await this.getVote(optionId, userId);

    if (existingVote) {
      throw new BadRequestException('You have already voted for this option');
    }

    const vote = await this.prisma.pollOptionVote.create({
      data: {
        optionId,
        userId,
      },
    });

    return vote;
  }

  async removeVotesFromPoll(pollId: string, userId: string) {
    const poll = await this.pollsService.findOne(pollId);

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    await this.prisma.pollOptionVote.deleteMany({
      where: {
        option: {
          pollId,
        },
        OR: [{ userId }, { option: { poll: { post: { authorId: userId } } } }],
      },
    });
  }
}
