import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { check } from 'src/_common/check';
import { TeamsService } from 'src/teams/teams.service';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { MatchStatus } from '@prisma/client';

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TeamsService))
    private readonly teamsService: TeamsService,
    private readonly usersService: UsersService,
  ) {}

  async calculatePlayerStats(userId: string) {
    return await this.prisma.player.aggregate({
      where: {
        userId,
        team: {
          match: {
            status: MatchStatus.COMPLETED,
          },
        },
      },
      _sum: {
        goals: true,
        assists: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        rating: true,
      },
    });
  }

  async getRatingCount(
    userId: string,
    statuses: MatchStatus[] = [MatchStatus.COMPLETED],
  ) {
    return await this.prisma.player.count({
      where: {
        userId,
        team: {
          match: {
            status: {
              in: statuses,
            },
          },
        },
        rating: {
          not: null,
        },
      },
    });
  }

  async getTopRatedPlayers(limit: number = 10) {
    const players = await this.prisma.player.groupBy({
      by: ['userId'],
      where: {
        userId: { not: null },
        user: { deletedAt: null },
        team: { match: { status: MatchStatus.COMPLETED } },
      },
      _avg: {
        rating: true,
      },
      orderBy: {
        _avg: {
          rating: 'desc',
        },
      },
      take: limit,
    });

    const users = await this.usersService.findUsersWithIds(
      players.map((player) => player.userId!),
    );

    return players
      .filter((player) => player.userId !== null)
      .map((player) => {
        const userId = player.userId!;
        const user = users.find((user) => user.id === userId)!;

        return {
          user,
          rating: player._avg.rating ?? 0,
        };
      });
  }

  async getTopScorers(limit: number = 10) {
    const players = await this.prisma.player.groupBy({
      by: ['userId'],
      where: {
        userId: { not: null },
        user: { deletedAt: null },
        team: { match: { status: MatchStatus.COMPLETED } },
      },
      _sum: {
        goals: true,
      },
      _avg: {
        goals: true,
      },
      orderBy: {
        _sum: {
          goals: 'desc',
        },
      },
      take: limit,
    });

    const users = await this.usersService.findUsersWithIds(
      players.map((player) => player.userId!),
    );

    return players
      .filter((player) => player.userId !== null)
      .map((player) => {
        const userId = player.userId!;
        const user = users.find((user) => user.id === userId)!;

        return {
          user,
          goals: player._sum.goals,
          averageGoals: player._avg.goals,
        };
      });
  }

  async getTopAssisters(limit: number = 10) {
    const players = await this.prisma.player.groupBy({
      by: ['userId'],
      where: {
        userId: { not: null },
        user: { deletedAt: null },
        team: { match: { status: MatchStatus.COMPLETED } },
      },
      _sum: {
        assists: true,
      },
      _avg: {
        assists: true,
      },
      orderBy: {
        _sum: {
          assists: 'desc',
        },
      },
      take: limit,
    });

    const users = await this.usersService.findUsersWithIds(
      players.map((player) => player.userId!),
    );

    return players
      .filter((player) => player.userId !== null)
      .map((player) => {
        const userId = player.userId!;
        const user = users.find((user) => user.id === userId)!;

        return {
          user,
          assists: player._sum.assists,
          averageAssists: player._avg.assists,
        };
      });
  }

  async getTopActivePlayers(limit: number = 10) {
    const players = await this.prisma.player.groupBy({
      by: ['userId'],
      where: {
        userId: { not: null },
        user: { deletedAt: null },
        team: { match: { status: MatchStatus.COMPLETED } },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    const users = await this.usersService.findUsersWithIds(
      players.map((player) => player.userId!),
    );

    return players
      .filter((player) => player.userId !== null)
      .map((player) => {
        const userId = player.userId!;
        const user = users.find((user) => user.id === userId)!;

        return {
          user,
          matches: player._count.id,
        };
      });
  }

  async findOne(id: string) {
    this.logger.log(`Finding player with id: ${id}`);

    const player = await this.prisma.player.findUnique({
      where: { id },
    });

    return player;
  }

  async getPlayersOfTeam(teamId: string) {
    this.logger.log(`Getting players of team with id: ${teamId}`);

    return await this.prisma.player.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async create(createPlayerDto: CreatePlayerDto, teamId: string) {
    this.logger.log(
      `Creating player with team id: ${teamId} with data: ${JSON.stringify(
        createPlayerDto,
      )}`,
    );

    if (createPlayerDto.userId) {
      this.logger.log(
        `User id is provided, finding user with id: ${createPlayerDto.userId}`,
      );

      const user = await this.usersService.findOne(createPlayerDto.userId);

      if (!user) {
        this.logger.log(
          `User with id ${createPlayerDto.userId} not found, throwing not found exception`,
        );

        throw new NotFoundException('User not found');
      }

      this.logger.log(
        `User with id ${createPlayerDto.userId} found, setting user id and name`,
      );

      createPlayerDto.userId = user.id;
      createPlayerDto.name = `${user.firstName} ${user.lastName}`;

      this.logger.log(
        `User with id ${createPlayerDto.userId} found, setting user id and name to ${createPlayerDto.name}`,
      );
    }

    const player = await this.prisma.player.create({
      data: {
        ...createPlayerDto,
        teamId,
      },
    });

    this.logger.log('Player created:');
    Object.entries(player).forEach(([key, value]) => {
      this.logger.log(`${key}: ${JSON.stringify(value)}`);
    });

    return player;
  }

  async removePlayerFromTeam(playerId: string, teamId: string) {
    const player = check(await this.findOne(playerId), 'Player not found');
    const team = check(
      await this.teamsService.findOne(teamId),
      'Team not found',
    );

    if (player.teamId !== team.id) {
      throw new BadRequestException('Player is not in the team');
    }

    return await this.prisma.player.delete({
      where: { id: playerId },
    });
  }

  async update(id: string, teamId: string, updatePlayerDto: UpdatePlayerDto) {
    const player = await this.findOne(id);

    if (!player) {
      return await this.create(updatePlayerDto, teamId);
    }

    return await this.prisma.player.update({
      where: { id: player.id },
      data: updatePlayerDto,
    });
  }
}
