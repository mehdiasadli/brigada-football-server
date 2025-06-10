import { createZodDto } from 'nestjs-zod';
import { teamSchema } from '../entities/team.entity';
import z from 'zod';
import { updatePlayerSchema } from 'src/players/dto/update-player.dto';

export const updateTeamSchema = teamSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    matchId: true,
  })
  .merge(
    z.object({
      players: z.array(updatePlayerSchema.merge(z.object({ id: z.string() }))),
      deletedPlayers: z.array(z.string().uuid('Invalid player id')).nullish(),
    }),
  );

export class UpdateTeamDto extends createZodDto(updateTeamSchema) {}
