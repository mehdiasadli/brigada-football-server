import { Controller, Param, Post } from '@nestjs/common';
import { PollOptionVotesService } from './poll-option-votes.service';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';

@Controller('poll-option-votes')
export class PollOptionVotesController {
  constructor(
    private readonly pollOptionVotesService: PollOptionVotesService,
  ) {}

  @Post(':optionId')
  async create(
    @Param('optionId') optionId: string,
    @CurrentUser() currentUserId: string,
  ) {
    return this.pollOptionVotesService.create(optionId, currentUserId);
  }
}
