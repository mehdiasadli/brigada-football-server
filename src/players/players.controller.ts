import { Body, Controller, Get, Param, Post, Delete } from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  // Get all players of a team with given `:teamId` on request.params
  @Get(':teamId')
  async getPlayersOfTeam(@Param('teamId') teamId: string) {
    return this.playersService.getPlayersOfTeam(teamId);
  }

  // Create a new player to the team with given `:teamId` on request.params
  @Post(':teamId')
  async create(
    @Param('teamId') teamId: string,
    @Body() createPlayerDto: CreatePlayerDto,
  ) {
    return this.playersService.create(createPlayerDto, teamId);
  }

  // Remove a player with given `:id` from the team with given `:teamId` on request.params
  @Delete(':id/:teamId')
  async remove(@Param('id') id: string, @Param('teamId') teamId: string) {
    return this.playersService.removePlayerFromTeam(id, teamId);
  }
}
