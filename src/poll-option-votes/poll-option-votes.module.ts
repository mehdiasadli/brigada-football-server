import { Module } from '@nestjs/common';
import { PollOptionVotesService } from './poll-option-votes.service';
import { PollOptionVotesController } from './poll-option-votes.controller';
import { PollsModule } from 'src/polls/polls.module';

@Module({
  imports: [PollsModule],
  controllers: [PollOptionVotesController],
  providers: [PollOptionVotesService],
})
export class PollOptionVotesModule {}
