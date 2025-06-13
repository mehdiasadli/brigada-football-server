import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UsersModule } from 'src/users/users.module';
import { VenuesModule } from 'src/venues/venues.module';
import { MatchesModule } from 'src/matches/matches.module';
import { PostsModule } from 'src/posts/posts.module';

@Module({
  imports: [UsersModule, VenuesModule, MatchesModule, PostsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
