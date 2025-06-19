import { Body, Controller, Post } from '@nestjs/common';
import { PollOptionVotesService } from './poll-option-votes.service';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { CreatePollOptionVoteDto } from './dto/create-poll-option-vote.dto';

@Controller('poll-option-votes')
export class PollOptionVotesController {
  constructor(
    private readonly pollOptionVotesService: PollOptionVotesService,
  ) {}

  @Post()
  async create(
    @Body() createPollOptionVoteDto: CreatePollOptionVoteDto,
    @CurrentUser() currentUserId: string,
  ) {
    return this.pollOptionVotesService.vote(
      createPollOptionVoteDto,
      currentUserId,
    );
  }
}
