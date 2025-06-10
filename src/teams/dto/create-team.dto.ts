import { createZodDto } from 'nestjs-zod';
import { teamSchema } from '../entities/team.entity';
import { createPlayerSchema } from 'src/players/dto/create-player.dto';
import { z } from 'zod';

export const createTeamSchema = teamSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    matchId: true,
  })
  .merge(
    z.object({
      players: createPlayerSchema.array(),
    }),
  );

export class CreateTeamDto extends createZodDto(createTeamSchema) {}
