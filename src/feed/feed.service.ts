import { Injectable, UnauthorizedException } from '@nestjs/common';
import { MatchesService } from 'src/matches/matches.service';
import { PostsService } from 'src/posts/posts.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FeedService {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly matchesService: MatchesService,
  ) {}

  async getFeed(currentUserId: string) {
    const user = await this.usersService.findOne(currentUserId);

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const posts = await this.postsService.getPostsForFeed(currentUserId);
    const matches = await this.matchesService.getMatchesForFeed(currentUserId);

    const feed = [...posts, ...matches].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return feed;
  }
}
