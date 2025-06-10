import { Controller } from '@nestjs/common';
import { PollOptionAttachmentsService } from './poll-option-attachments.service';

@Controller('poll-option-attachments')
export class PollOptionAttachmentsController {
  constructor(
    private readonly pollOptionAttachmentsService: PollOptionAttachmentsService,
  ) {}
}
