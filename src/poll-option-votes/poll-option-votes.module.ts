import { Module } from '@nestjs/common';
import { PollOptionVotesService } from './poll-option-votes.service';
import { PollOptionVotesController } from './poll-option-votes.controller';
import { PollsModule } from 'src/polls/polls.module';
import { PollOptionsModule } from 'src/poll-options/poll-options.module';

@Module({
  imports: [PollsModule, PollOptionsModule],
  controllers: [PollOptionVotesController],
  providers: [PollOptionVotesService],
})
export class PollOptionVotesModule {}
