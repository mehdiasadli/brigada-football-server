import { Module } from '@nestjs/common';
import { PostAttachmentsService } from './post-attachments.service';
import { PostAttachmentsController } from './post-attachments.controller';

@Module({
  controllers: [PostAttachmentsController],
  providers: [PostAttachmentsService],
})
export class PostAttachmentsModule {}
