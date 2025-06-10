import { Injectable } from '@nestjs/common';
import { MatchesService } from 'src/matches/matches.service';
import { PlayersService } from 'src/players/players.service';

@Injectable()
export class StatsService {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly playersService: PlayersService,
  ) {}

  async calculateStats(userId: string) {
    const matchesCreated =
      await this.matchesService.calculateCreatedMatchesCount(userId);
    const playerStats = await this.playersService.calculatePlayerStats(userId);
    const ratingCount = await this.playersService.getRatingCount(userId);

    return {
      userId,
      totalGoals: playerStats._sum.goals,
      totalAssists: playerStats._sum.assists,
      matchesPlayed: playerStats._count.id,
      matchesCreated,
      totalRatingCount: ratingCount,
      averageRating: playerStats._avg.rating
        ? Number(playerStats._avg.rating.toFixed(2))
        : null,
    };
  }

  async calculateMultipleUserStats(userIds: string[]) {
    return await Promise.all(
      userIds.map(async (userId) => this.calculateStats(userId)),
    );
  }

  async getLeaderboard() {
    const topScorers = await this.playersService.getTopScorers();
    const topAssisters = await this.playersService.getTopAssisters();
    const topRatedPlayers = await this.playersService.getTopRatedPlayers();
    const topActivePlayers = await this.playersService.getTopActivePlayers();

    return {
      topScorers,
      topAssisters,
      topRatedPlayers,
      topActivePlayers,
    };
  }
}
