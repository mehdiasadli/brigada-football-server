import { Controller, Get, Param, Post } from '@nestjs/common';
import { LikesService } from './likes.service';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':postId')
  async likePost(
    @Param('postId') postId: string,
    @CurrentUser() userId: string,
  ) {
    return this.likesService.toggleLike(postId, userId);
  }

  @Get('post/:postId')
  async getLikesOfPost(@Param('postId') postId: string) {
    return this.likesService.getLikesOfPost(postId);
  }

  @Get('comment/:commentId')
  async getLikesOfComment(@Param('commentId') commentId: string) {
    return this.likesService.getLikesOfComment(commentId);
  }
}
