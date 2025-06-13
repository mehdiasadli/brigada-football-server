import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('mock')
  createMock(@CurrentUser() currentUserId: string) {
    console.log(currentUserId);
    return this.postsService.createMock(10, currentUserId);
  }

  @Get(':id')
  getPostById(@Param('id') postId: string) {
    return this.postsService.getPostById(postId);
  }

  @Get('user/:userId')
  getPostsOfUser(@Param('userId') userId: string) {
    return this.postsService.getPostsOfUser(userId);
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
