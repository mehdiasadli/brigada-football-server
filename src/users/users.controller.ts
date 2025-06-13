import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Query,
  Post,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-user.dto';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { PaginationDto } from 'src/_common/lib/query.pagination';
import { SearchDto } from 'src/_common/lib/query.search';
import { OrderDto } from 'src/_common/lib/query.order';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search/players')
  searchForMatch(
    @Query('query') query: string,
    @Query('excludeIds') excludeIds: string[] = [],
  ) {
    return this.usersService.searchUsersForMatch(query, excludeIds);
  }

  @Post('mock')
  createMockUsers() {
    return this.usersService.createMockUsers(10);
  }

  // Get one user by username
  @Get('with-username/:username')
  getOneByUsername(@Param('username') username: string) {
    return this.usersService.getOneByUsername(username);
  }

  // Get all users
  @Get()
  getAll(
    @Query() paginationDto: PaginationDto,
    @Query() orderDto: OrderDto,
    @Query() searchDto: SearchDto,
  ) {
    return this.usersService.findAll(paginationDto, orderDto, searchDto);
  }

  // Get one user by id
  @Get(':id')
  getOneById(@Param('id') id: string) {
    return this.usersService.getOneById(id);
  }

  // Update role of a user
  @Put('update-role/:id')
  updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() currentUserId: string,
  ) {
    return this.usersService.updateRole(id, updateRoleDto, currentUserId);
  }

  // Delete a user
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() currentUserId: string) {
    return this.usersService.delete(id, currentUserId);
  }
}
