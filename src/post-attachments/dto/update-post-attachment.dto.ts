import { PartialType } from '@nestjs/mapped-types';
import { CreatePostAttachmentDto } from './create-post-attachment.dto';

export class UpdatePostAttachmentDto extends PartialType(CreatePostAttachmentDto) {}
