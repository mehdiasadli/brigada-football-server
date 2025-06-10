import { Module } from '@nestjs/common';
import { PollOptionAttachmentsService } from './poll-option-attachments.service';
import { PollOptionAttachmentsController } from './poll-option-attachments.controller';

@Module({
  controllers: [PollOptionAttachmentsController],
  providers: [PollOptionAttachmentsService],
})
export class PollOptionAttachmentsModule {}
