import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { FriendshipsModule } from 'src/friendships/friendships.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [FriendshipsModule, UsersModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
