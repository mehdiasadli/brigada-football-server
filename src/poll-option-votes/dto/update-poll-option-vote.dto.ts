import { PartialType } from '@nestjs/mapped-types';
import { CreatePollOptionVoteDto } from './create-poll-option-vote.dto';

export class UpdatePollOptionVoteDto extends PartialType(CreatePollOptionVoteDto) {}
