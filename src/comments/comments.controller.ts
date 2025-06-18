import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { PaginationDto } from 'src/_common/lib/query.pagination';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':postId')
  create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() currentUserId: string,
  ) {
    return this.commentsService.create(createCommentDto, postId, currentUserId);
  }

  @Delete(':commentId')
  delete(
    @Param('commentId') commentId: string,
    @CurrentUser() currentUserId: string,
  ) {
    return this.commentsService.delete(commentId, currentUserId);
  }

  @Get(':postId')
  getCommentsOfPost(
    @Param('postId') postId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.commentsService.getCommentsOfPost(postId, paginationDto);
  }
}
