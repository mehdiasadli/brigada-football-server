import { PartialType } from '@nestjs/mapped-types';
import { CreatePollOptionAttachmentDto } from './create-poll-option-attachment.dto';

export class UpdatePollOptionAttachmentDto extends PartialType(CreatePollOptionAttachmentDto) {}
