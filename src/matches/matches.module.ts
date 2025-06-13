import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { TeamsModule } from 'src/teams/teams.module';
import { FriendshipsModule } from 'src/friendships/friendships.module';

@Module({
  imports: [TeamsModule, FriendshipsModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
