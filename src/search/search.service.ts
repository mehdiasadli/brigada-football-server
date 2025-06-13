import { Injectable } from '@nestjs/common';
import { MatchesService } from 'src/matches/matches.service';
import { PostsService } from 'src/posts/posts.service';
import { UsersService } from 'src/users/users.service';
import { VenuesService } from 'src/venues/venues.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly matchesService: MatchesService,
    private readonly venuesService: VenuesService,
  ) {}

  async search(query: string, currentUserId: string) {
    query = query.trim();

    const posts = await this.postsService.globalSearch(query, currentUserId);
    const users = await this.usersService.globalSearch(query, currentUserId);

    return this.shuffleArray([...posts, ...users]);
  }

  private shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
  }
}
