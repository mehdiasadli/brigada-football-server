import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { MatchesService } from 'src/matches/matches.service';
import { PostsService } from 'src/posts/posts.service';
import { UsersService } from 'src/users/users.service';
import { VenuesService } from 'src/venues/venues.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly venuesService: VenuesService,
    private readonly usersService: UsersService,
    private readonly matchesService: MatchesService,
    private readonly postsService: PostsService,
  ) {}

  private async checkAdmin(currentUserId: string) {
    const currentUser = await this.usersService.findOne(currentUserId);

    if (!currentUser) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    }
  }

  async getDashboardStats(currentUserId: string) {
    await this.checkAdmin(currentUserId);

    const usersStats = await this.usersService.getUsersStats();
    const venuesStats = await this.venuesService.getVenuesStats();
    const matchesStats = await this.matchesService.getMatchesStats();
    const postsStats = await this.postsService.getPostsStats();

    return {
      usersStats,
      venuesStats,
      matchesStats,
      postsStats,
    };
  }

  async getDashboardUsersChart() {
    const usersChart = await this.usersService.getCreatedChart();

    return usersChart;
  }

  async getDashboardMatchesChart() {
    const matchesChart = await this.matchesService.getMatchesChart();
    return matchesChart;
  }

  async getDashboardPostsChart() {
    const postsChart = await this.postsService.getPostsChart();
    return postsChart;
  }

  async getDashboardCharts(currentUserId: string) {
    await this.checkAdmin(currentUserId);

    const usersChart = await this.usersService.getCreatedChart();
    const matchesChart = await this.matchesService.getMatchesChart();
    const postsChart = await this.postsService.getPostsChart();

    return {
      users: usersChart,
      matches: matchesChart,
      posts: postsChart,
    };
  }
}
