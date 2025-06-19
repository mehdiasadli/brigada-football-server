import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PollOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOptionsOfPoll(pollId: string) {
    return await this.prisma.pollOption.findMany({
      where: {
        pollId,
      },
      include: {
        _count: {
          select: { votes: true },
        },
        votes: {
          select: {
            userId: true,
          },
        },
      },
    });
  }
}
