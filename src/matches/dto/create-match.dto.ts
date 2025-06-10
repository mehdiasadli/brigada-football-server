import { createZodDto } from 'nestjs-zod';
import { matchSchema } from '../entities/match.entity';
import z from 'zod';
import { createTeamSchema } from 'src/teams/dto/create-team.dto';

export const createMatchSchema = matchSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    creatorId: true,
  })
  .merge(
    z.object({
      team1: createTeamSchema,
      team2: createTeamSchema,
    }),
  );

export class CreateMatchDto extends createZodDto(createMatchSchema) {}
