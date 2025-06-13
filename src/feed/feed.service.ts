import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  PaginationBuilder,
  PaginationDto,
} from 'src/_common/lib/query.pagination';
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

  async getFeed(currentUserId: string, paginationDto: PaginationDto) {
    const user = await this.usersService.findOne(currentUserId);
    const pagination = new PaginationBuilder(paginationDto);

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const { posts, total: totalPosts } =
      await this.postsService.getPostsForFeed(currentUserId, paginationDto);
    const { matches, total: totalMatches } =
      await this.matchesService.getMatchesForFeed(currentUserId, paginationDto);

    const feed = [...posts, ...matches].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const totalCount = totalPosts + totalMatches;

    return pagination.paginate(feed, totalCount);
  }
}
