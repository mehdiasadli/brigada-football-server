import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { UpdateTeamDto } from './dto/update-team.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get(':id')
  async getOneById(@Param('id') id: string) {
    return this.teamsService.getTeam(id);
  }

  // Get all teams of a match with given `:matchId` on request.params
  @Get('/match/:matchId')
  async getTeamsOfMatch(@Param('matchId') matchId: string) {
    return this.teamsService.getTeamsOfMatch(matchId);
  }

  // Update a team with given `:id` on request.params
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(id, updateTeamDto);
  }
}
