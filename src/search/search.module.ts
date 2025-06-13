import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { UsersModule } from 'src/users/users.module';
import { PostsModule } from 'src/posts/posts.module';
import { MatchesModule } from 'src/matches/matches.module';
import { VenuesModule } from 'src/venues/venues.module';

@Module({
  imports: [UsersModule, PostsModule, MatchesModule, VenuesModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
