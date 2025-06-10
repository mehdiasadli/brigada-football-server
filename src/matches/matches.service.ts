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

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly teamsService: TeamsService,
  ) {}

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
