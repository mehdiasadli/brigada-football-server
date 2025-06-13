import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { FeedService } from './feed.service';
import { PaginationDto } from 'src/_common/lib/query.pagination';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getFeed(
    @CurrentUser() currentUserId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.feedService.getFeed(currentUserId, paginationDto);
  }
}
