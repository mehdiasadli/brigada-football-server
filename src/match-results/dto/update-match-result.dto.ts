import { PartialType } from '@nestjs/mapped-types';
import { CreateMatchResultDto } from './create-match-result.dto';

export class UpdateMatchResultDto extends PartialType(CreateMatchResultDto) {}
