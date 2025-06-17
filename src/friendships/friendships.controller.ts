import { Controller, Get, Param, Post, Put } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';

@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {
    console.log('FriendshipsController initialized');
  }

  @Get('requests')
  async getFriendshipRequests(@CurrentUser() userId: string) {
    console.log('getFriendshipRequests called with userId:', userId);
    return await this.friendshipsService.getFriendshipRequests(userId);
  }

  @Get('friends/:userId')
  async getFriendsOfUser(@Param('userId') userId: string) {
    return await this.friendshipsService.getFriendsOfUser(userId);
  }

  @Post('request/:friendId')
  async sendFriendshipRequest(
    @Param('friendId') friendId: string,
    @CurrentUser() userId: string,
  ) {
    return await this.friendshipsService.sendFriendshipRequest(
      friendId,
      userId,
    );
  }

  @Put('request/:id/cancel')
  async cancelFriendshipRequest(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ) {
    return await this.friendshipsService.cancelFriendshipRequest(id, userId);
  }

  @Put('request/:id/reject')
  async rejectFriendshipRequest(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ) {
    return await this.friendshipsService.rejectFriendshipRequest(id, userId);
  }

  @Put('request/:id/accept')
  async acceptFriendshipRequest(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ) {
    return await this.friendshipsService.acceptFriendshipRequest(id, userId);
  }
}
