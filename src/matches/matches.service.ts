import { Injectable, Logger } from '@nestjs/common';
import { CreateMatchDto } from './dto/create-match.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TeamsService } from 'src/teams/teams.service';
import {
  PaginationBuilder,
  PaginationDto,
} from 'src/_common/lib/query.pagination';
import { OrderBuilder, OrderDto } from 'src/_common/lib/query.order';
import { check } from 'src/_common/check';
import { UpdateMatchDto } from './dto/update-match.dto';
import { FindFiltersDto } from './dto/find-filters.dto';
import { CompleteMatchDto } from './dto/complete-match.dto';
import { MatchStatus } from '@prisma/client';
import { createMockMatches } from 'src/_common/mock/matches';
import { FriendshipsService } from 'src/friendships/friendships.service';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly teamsService: TeamsService,
    private readonly friendshipsService: FriendshipsService,
  ) {}

  async globalSearch(query: string) {
    const queryDate = new Date(query);
    const isDate = !isNaN(queryDate.getTime());

    const startDate = new Date(queryDate.setDate(queryDate.getDate() - 2));
    const endDate = new Date(queryDate.setDate(queryDate.getDate() + 2));

    const matches = await this.prisma.match.findMany({
      where: {
        OR: [
          {
            startTime: !isDate
              ? undefined
              : {
                  gte: startDate,
                  lte: endDate,
                },
          },
          {
            teams: {
              some: {
                name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            venueName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            teams: {
              some: {
                players: {
                  some: {
                    name: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        venueName: true,
        startTime: true,
        status: true,
        teams: {
          select: {
            name: true,
          },
        },
      },
      take: 3,
    });

    return matches.map((match) => ({
      item: match,
      type: 'match' as const,
    }));
  }

  async getMatchesForFeed(currentUserId: string, paginationDto: PaginationDto) {
    const pagination = new PaginationBuilder(paginationDto);

    const friends =
      await this.friendshipsService.getFriendsOfUser(currentUserId);
    const friendIds = friends.map((friend) => friend.id);

    const [matches, total] = await Promise.all([
      await this.prisma.match.findMany({
        ...pagination.use(),
        where: {
          OR: [
            { creatorId: currentUserId },
            { creatorId: { in: friendIds } },
            {
              teams: {
                some: {
                  players: {
                    some: {
                      userId: currentUserId,
                    },
                  },
                },
              },
            },
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              username: true,
            },
          },
          venue: {
            select: {
              id: true,
              name: true,
              latitude: true,
              longitude: true,
            },
          },
          teams: {
            select: {
              id: true,
              name: true,
              players: {
                select: {
                  id: true,
                  assists: true,
                  goals: true,
                  isCaptain: true,
                  name: true,
                  positions: true,
                  rating: true,
                  user: {
                    select: {
                      avatar: true,
                      firstName: true,
                      lastName: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      await this.prisma.match.count({
        where: {
          OR: [
            { creatorId: currentUserId },
            { creatorId: { in: friendIds } },
            {
              teams: {
                some: {
                  players: {
                    some: {
                      userId: currentUserId,
                    },
                  },
                },
              },
            },
          ],
        },
      }),
    ]);

    return { matches, total };
  }

  async getMatchesChart() {
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

    const matchesCreated = await this.prisma.match.findMany({
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

    const matchesCompleted = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.COMPLETED,
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

    const matchesPending = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.PENDING,
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

    const monthlyData: any[] = [];

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - 1 - i, 1);
      const targetMonth = targetDate.getMonth() + 1; // Convert to 1-12
      const targetYear = targetDate.getFullYear();

      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59); // Last day of month

      const matchesCreatedCount = matchesCreated.filter((match) => {
        const matchCreatedAt = new Date(match.createdAt);
        return matchCreatedAt >= monthStart && matchCreatedAt <= monthEnd;
      }).length;

      const matchesCompletedCount = matchesCompleted.filter((user) => {
        const userCreatedAt = new Date(user.createdAt);
        return userCreatedAt >= monthStart && userCreatedAt <= monthEnd;
      }).length;

      const matchesPendingCount = matchesPending.filter((match) => {
        const matchCreatedAt = new Date(match.createdAt);
        return matchCreatedAt >= monthStart && matchCreatedAt <= monthEnd;
      }).length;

      monthlyData.push({
        month: targetMonth,
        matchesCreatedCount,
        matchesCompletedCount,
        matchesPendingCount,
      });
    }

    return monthlyData;
  }

  async getMatchesStats() {
    const totalMatches = await this.prisma.match.count({
      where: {
        status: MatchStatus.COMPLETED,
      },
    });

    const completedMatchesInThisMonth = await this.prisma.match.count({
      where: {
        status: MatchStatus.COMPLETED,
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    const completedMatchesInLastMonth = await this.prisma.match.count({
      where: {
        status: MatchStatus.COMPLETED,
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 2)),
          lte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    return {
      totalMatches,
      completedMatchesInThisMonth,
      completedMatchesInLastMonth,
    };
  }

  async calculateCreatedMatchesCount(userId: string) {
    return await this.prisma.match.count({
      where: {
        creatorId: userId,
      },
    });
  }

  async createMockMatches(count: number, currentUserId: string) {
    const matches = createMockMatches(count);

    return await Promise.all(
      matches.map((match) => this.create(match, currentUserId)),
    );
  }

  async create(createMatchDto: CreateMatchDto, currentUserId: string) {
    this.logger.log(
      `Creating match with data: ${JSON.stringify(createMatchDto)}`,
    );
    const { team1: team1Dto, team2: team2Dto, ...dto } = createMatchDto;

    const match = await this.prisma.match.create({
      data: {
        ...dto,
        creatorId: currentUserId,
      },
    });

    this.logger.log('Match created:');
    Object.entries(match).forEach(([key, value]) => {
      this.logger.log(`${key}: ${JSON.stringify(value)}`);
    });

    const [team1, team2] = await Promise.all([
      this.teamsService.create(team1Dto, match.id),
      this.teamsService.create(team2Dto, match.id),
    ]);

    return {
      match,
      teams: [team1, team2],
    };
  }

  async complete(matchId: string, completeMatchDto: CompleteMatchDto) {
    const match = check(await this.findOne(matchId), 'Match not found');

    const { teams, ...dto } = completeMatchDto;

    const [team1, team2] = await Promise.all([
      this.teamsService.update(match.teams[0].id, teams[0]),
      this.teamsService.update(match.teams[1].id, teams[1]),
    ]);

    const updatedMatch = await this.prisma.match.update({
      where: { id: match.id },
      data: {
        ...dto,
        status: MatchStatus.COMPLETED,
      },
    });

    return {
      match: updatedMatch,
      teams: [team1, team2],
    };
  }

  async findOne(id: string) {
    return await this.prisma.match.findUnique({
      where: { id },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            players: {
              select: {
                id: true,
                assists: true,
                goals: true,
                isCaptain: true,
                name: true,
                positions: true,
                rating: true,
                user: {
                  select: {
                    avatar: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getMatchById(id: string) {
    return check(await this.findOne(id), 'Match not found');
  }

  async findAll(
    paginationDto: PaginationDto,
    orderDto: OrderDto,
    filtersDto: FindFiltersDto,
  ) {
    const pagination = new PaginationBuilder(paginationDto);
    const order = new OrderBuilder(orderDto);

    const [matches, totalItems] = await this.prisma.$transaction([
      this.prisma.match.findMany({
        ...pagination.use(),
        orderBy: order.use(),
        where: {
          status: filtersDto.status ?? undefined,
        },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
              username: true,
            },
          },
          venue: {
            select: {
              id: true,
              name: true,
              address: true,
              addressDescription: true,
              latitude: true,
              longitude: true,
            },
          },
          teams: {
            select: {
              id: true,
              name: true,
              players: {
                select: {
                  id: true,
                  name: true,
                  goals: true,
                  assists: true,
                  isCaptain: true,
                  positions: true,
                  rating: true,
                  userId: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.match.count({
        where: {
          status: filtersDto.status ?? undefined,
        },
      }),
    ]);

    return pagination.paginate(matches, totalItems);
  }

  async update(id: string, updateMatchDto: UpdateMatchDto) {
    const match = check(await this.findOne(id), 'Match not found');

    return await this.prisma.match.update({
      where: { id: match.id },
      data: updateMatchDto,
    });
  }

  async delete(id: string) {
    const match = check(await this.findOne(id), 'Match not found');

    const deletedMatch = await this.prisma.match.delete({
      where: { id: match.id },
    });

    return deletedMatch;
  }
}
