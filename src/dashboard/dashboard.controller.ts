import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboardStats(@CurrentUser() currentUserId: string) {
    return this.dashboardService.getDashboardStats(currentUserId);
  }

  @Get('charts')
  async getDashboardCharts(@CurrentUser() currentUserId: string) {
    return this.dashboardService.getDashboardCharts(currentUserId);
  }
}
