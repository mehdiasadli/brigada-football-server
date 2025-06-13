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

    const currentPlayer = await this.prisma.player.findUnique({
      where: { id: player.id },
      include: { user: true },
    });

    if (!currentPlayer) {
      throw new NotFoundException('Player not found');
    }

    const { userId, name, ...rest } = updatePlayerDto;

    const isBecomingUser = !currentPlayer.userId && userId;
    const isBecomingNonUser = currentPlayer.userId && !userId;
    const isChangingUser =
      currentPlayer.userId && userId && currentPlayer.userId !== userId;
    const isUserValidated = userId
      ? !!(await this.usersService.findOne(userId))
      : true;

    if (userId && !isUserValidated) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const updateData: any = {
      ...rest,
      name: name || currentPlayer.name,
    };

    if (isBecomingNonUser) {
      // Converting from user to non-user: clear userId, keep manual name
      updateData.userId = null;
      updateData.name = name || currentPlayer.name; // Use provided name or keep existing

      console.log(
        `Player ${id} converting from user to non-user. Name: ${updateData.name}`,
      );
    } else if (isBecomingUser || isChangingUser) {
      // Converting to user or changing user: set userId and update name from user data
      const user = await this.prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!user) {
        throw new NotFoundException(
          `User with id ${userId} not found or deleted`,
        );
      }

      updateData.userId = userId;
      // Override name with user's full name when assigning a user
      updateData.name = `${user.firstName} ${user.lastName}`;

      console.log(
        `Player ${id} converting to user ${userId}. Name updated to: ${updateData.name}`,
      );
    } else {
      // No userId change, just update other fields
      updateData.userId = currentPlayer.userId;
      updateData.name = name || currentPlayer.name;
    }

    // Perform the update
    const updatedPlayer = await this.prisma.player.update({
      where: { id: player.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    console.log(`Player ${id} updated successfully:`, {
      name: updatedPlayer.name,
      userId: updatedPlayer.userId,
      hasUser: !!updatedPlayer.user,
    });

    return updatedPlayer;
  }

  private async validateUser(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
    });
    return !!user;
  }
}
