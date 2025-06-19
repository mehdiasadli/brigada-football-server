import { forwardRef, Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { FriendshipsModule } from 'src/friendships/friendships.module';
import { UsersModule } from 'src/users/users.module';
import { PollsModule } from 'src/polls/polls.module';

@Module({
  imports: [FriendshipsModule, UsersModule, forwardRef(() => PollsModule)],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
