import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getFeed(@CurrentUser() currentUserId: string) {
    return this.feedService.getFeed(currentUserId);
  }
}
