import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { VenuesService } from './venues.service';
import { PaginationDto } from 'src/_common/lib/query.pagination';
import { OrderDto } from 'src/_common/lib/query.order';
// import { SearchDto } from 'src/_common/lib/query.search';
import { CreateVenueDto } from './dto/create-venue.dto';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { UpdateVenueDto } from './dto/update-venue.dto';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Post('mock')
  async createMock(
    @CurrentUser() currentUserId: string,
    @Query('count') count?: string,
  ) {
    return this.venuesService.createMock(
      count ? parseInt(count) : 10,
      currentUserId,
    );
  }

  @Get()
  async findMany(
    @Query() paginationDto: PaginationDto,
    @Query() orderDto: OrderDto,
    // @Query() searchDto: SearchDto,
  ) {
    return this.venuesService.findMany(paginationDto, orderDto);
  }

  @Get('map')
  async getVenuesForMap() {
    return this.venuesService.getVenuesForMap();
  }

  @Get('search')
  async searchVenues(@Query('query') query: string) {
    return this.venuesService.searchVenues(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.venuesService.getOneById(id);
  }

  @Post()
  async create(
    @Body() createVenueDto: CreateVenueDto,
    @CurrentUser() currentUserId: string,
  ) {
    return this.venuesService.create(createVenueDto, currentUserId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVenueDto: UpdateVenueDto,
    @CurrentUser() currentUserId: string,
  ) {
    return this.venuesService.update(id, updateVenueDto, currentUserId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() currentUserId: string) {
    return this.venuesService.delete(id, currentUserId);
  }
}
