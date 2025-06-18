import { Injectable } from '@nestjs/common';
import { CommentsService } from 'src/comments/comments.service';
import { LikesService } from 'src/likes/likes.service';
import { MatchesService } from 'src/matches/matches.service';
import { PlayersService } from 'src/players/players.service';
import { PostsService } from 'src/posts/posts.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class StatsService {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly playersService: PlayersService,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
    private readonly usersService: UsersService,
  ) {}

  async calculateStats(userId: string) {
    const matchesCreated =
      await this.matchesService.calculateCreatedMatchesCount(userId);
    const playerStats = await this.playersService.calculatePlayerStats(userId);
    const ratingCount = await this.playersService.getRatingCount(userId);
    const postCount = await this.postsService.getPostCountOfUser(userId);
    const commentCount =
      await this.commentsService.getCommentCountOfUser(userId);
    const likeCount = await this.likesService.getLikeCountOfUser(userId);
    const activityPoints =
      await this.usersService.getUserActivityPoints(userId);

    const averageRating = playerStats._avg.rating
      ? Number(playerStats._avg.rating.toFixed(2))
      : null;

    return {
      userId,
      totalGoals: playerStats._sum.goals,
      totalAssists: playerStats._sum.assists,
      matchesPlayed: playerStats._count.id,
      matchesCreated,
      totalRatingCount: ratingCount,
      averageRating,
      totalPosts: postCount,
      totalComments: commentCount,
      totalLikes: likeCount,
      activity: activityPoints,
    };
  }

  async calculateMultipleUserStats(userIds: string[]) {
    return await Promise.all(
      userIds.map(async (userId) => this.calculateStats(userId)),
    );
  }

  async getLeaderboard() {
    const topScorers = await this.playersService.getTopScorers();
    const topAssisters = await this.playersService.getTopAssisters();
    const topRatedPlayers = await this.playersService.getTopRatedPlayers();
    const topActivePlayers = await this.playersService.getTopActivePlayers();

    return {
      topScorers,
      topAssisters,
      topRatedPlayers,
      topActivePlayers,
    };
  }
}
