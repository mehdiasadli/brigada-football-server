import { Controller, Param, Get } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('users/:userId')
  async getUserStats(@Param('userId') userId: string) {
    return this.statsService.calculateStats(userId);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.statsService.getLeaderboard();
  }
}
