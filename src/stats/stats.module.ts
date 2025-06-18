import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { PlayersModule } from 'src/players/players.module';
import { MatchesModule } from 'src/matches/matches.module';
import { PostsModule } from 'src/posts/posts.module';
import { CommentsModule } from 'src/comments/comments.module';
import { LikesModule } from 'src/likes/likes.module';

@Module({
  imports: [
    MatchesModule,
    PlayersModule,
    PostsModule,
    CommentsModule,
    LikesModule,
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
