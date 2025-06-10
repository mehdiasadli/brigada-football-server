import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MatchResultsService } from './match-results.service';
import { CreateMatchResultDto } from './dto/create-match-result.dto';
import { UpdateMatchResultDto } from './dto/update-match-result.dto';

@Controller('match-results')
export class MatchResultsController {
  constructor(private readonly matchResultsService: MatchResultsService) {}

  @Post()
  create(@Body() createMatchResultDto: CreateMatchResultDto) {
    return this.matchResultsService.create(createMatchResultDto);
  }

  @Get()
  findAll() {
    return this.matchResultsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchResultsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMatchResultDto: UpdateMatchResultDto) {
    return this.matchResultsService.update(+id, updateMatchResultDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.matchResultsService.remove(+id);
  }
}
