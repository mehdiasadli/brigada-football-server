import { Module } from '@nestjs/common';
import { PollOptionVotesService } from './poll-option-votes.service';
import { PollOptionVotesController } from './poll-option-votes.controller';

@Module({
  controllers: [PollOptionVotesController],
  providers: [PollOptionVotesService],
})
export class PollOptionVotesModule {}
