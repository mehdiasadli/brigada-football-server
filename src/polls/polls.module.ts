import { forwardRef, Module } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { PostsModule } from 'src/posts/posts.module';

@Module({
  imports: [forwardRef(() => PostsModule)],
  controllers: [PollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}
