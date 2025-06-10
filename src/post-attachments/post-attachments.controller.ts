import { Controller } from '@nestjs/common';
import { PostAttachmentsService } from './post-attachments.service';

@Controller('post-attachments')
export class PostAttachmentsController {
  constructor(
    private readonly postAttachmentsService: PostAttachmentsService,
  ) {}
}
