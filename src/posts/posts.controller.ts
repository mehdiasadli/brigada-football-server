import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { PaginationDto } from 'src/_common/lib/query.pagination';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('mock')
  createMock(@CurrentUser() currentUserId: string) {
    console.log(currentUserId);
    return this.postsService.createMock(10, currentUserId);
  }

  @Get(':id')
  getPostById(
    @Param('id') postId: string,
    @CurrentUser() currentUserId: string,
  ) {
    return this.postsService.getPostById(postId, currentUserId);
  }

  @Get('user/:username')
  getPostsOfUser(
    @Param('username') username: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUserId: string,
  ) {
    return this.postsService.getPostsOfUser(
      username,
      currentUserId,
      paginationDto,
    );
  }

  @Post()
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() currentUserId: string,
  ) {
    return this.postsService.createPost(createPostDto, currentUserId);
  }

  @Delete(':id')
  delete(@Param('id') postId: string) {
    return this.postsService.deletePost(postId);
  }
}
