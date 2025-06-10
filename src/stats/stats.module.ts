import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { PlayersModule } from 'src/players/players.module';
import { MatchesModule } from 'src/matches/matches.module';

@Module({
  imports: [MatchesModule, PlayersModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
