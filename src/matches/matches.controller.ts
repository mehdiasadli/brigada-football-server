import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { PaginationDto } from 'src/_common/lib/query.pagination';
import { OrderDto } from 'src/_common/lib/query.order';
import { UpdateMatchDto } from './dto/update-match.dto';
import { FindFiltersDto } from './dto/find-filters.dto';
import { CompleteMatchDto } from './dto/complete-match.dto';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('mock')
  async createMockMatches(
    @CurrentUser() userId: string,
    @Query('count') count?: string,
  ) {
    return this.matchesService.createMockMatches(
      count ? parseInt(count) : 10,
      userId,
    );
  }

  @Post()
  async createMatch(
    @Body() createMatchDto: CreateMatchDto,
    @CurrentUser() currentUserId: string,
  ) {
    return this.matchesService.create(createMatchDto, currentUserId);
  }

  @Get('/:id')
  async getMatchById(@Param('id') id: string) {
    return this.matchesService.getMatchById(id);
  }

  @Get()
  async getMatches(
    @Query() paginationDto: PaginationDto,
    @Query() orderDto: OrderDto,
    @Query() filtersDto: FindFiltersDto,
  ) {
    return this.matchesService.findAll(paginationDto, orderDto, filtersDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMatchDto: UpdateMatchDto,
  ) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.matchesService.delete(id);
  }

  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() completeMatchDto: CompleteMatchDto,
  ) {
    return this.matchesService.complete(id, completeMatchDto);
  }
}
