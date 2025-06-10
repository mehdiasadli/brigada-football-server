import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlayersService } from 'src/players/players.service';
import { UpdateTeamDto } from './dto/update-team.dto';
import { check } from 'src/_common/check';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PlayersService))
    private readonly playersService: PlayersService,
  ) {}

  async findOne(id: string) {
    return await this.prisma.team.findUnique({
      where: { id },
    });
  }

  async getTeam(id: string) {
    const team = check(
      await this.prisma.team.findUnique({
        where: { id },
        include: {
          match: true,
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  avatar: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      'Team not found',
    );

    return team;
  }

  async getTeamsOfMatch(matchId: string) {
    return await this.prisma.team.findMany({
      where: { matchId },
    });
  }

  async create(createTeamDto: CreateTeamDto, matchId: string) {
    this.logger.log(
      `Creating team with data: ${JSON.stringify(createTeamDto)}`,
    );

    const { players, ...dto } = createTeamDto;

    const team = await this.prisma.team.create({
      data: {
        ...dto,
        matchId,
      },
    });

    this.logger.log('Team created:');
    Object.entries(team).forEach(([key, value]) => {
      this.logger.log(`${key}: ${JSON.stringify(value)}`);
    });

    const teamPlayers = await Promise.all(
      players.map(async (player) => {
        return await this.playersService.create(player, team.id);
      }),
    );

    return {
      ...team,
      players: teamPlayers,
    };
  }

  async update(id: string, updateTeamDto: UpdateTeamDto) {
    const team = check(await this.findOne(id), 'Team not found');

    const { players, deletedPlayers, ...dto } = updateTeamDto;

    if (deletedPlayers && deletedPlayers.length > 0) {
      await Promise.all(
        deletedPlayers.map(async (playerId) => {
          return await this.playersService.removePlayerFromTeam(
            playerId,
            team.id,
          );
        }),
      );
    }

    const nonDeletedPlayers = players.filter(
      (player) => !(deletedPlayers ?? []).includes(player.id),
    );

    const teamPlayers = await Promise.all(
      nonDeletedPlayers.map(async (player) => {
        return await this.playersService.update(player.id, team.id, player);
      }),
    );

    const updatedTeam = await this.prisma.team.update({
      where: { id: team.id },
      data: {
        ...dto,
      },
    });

    return {
      ...updatedTeam,
      players: teamPlayers,
    };
  }
}
