import { createZodDto } from 'nestjs-zod';
import { matchSchema } from '../entities/match.entity';
import z from 'zod';
import { updateTeamSchema } from 'src/teams/dto/update-team.dto';

export const completeMatchSchema = matchSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    creatorId: true,
    status: true,
    description: true,
    isPrivate: true,
    startTime: true,
    venueId: true,
    venueName: true,
  })
  .merge(
    z.object({
      teams: z.array(updateTeamSchema),
    }),
  );

export class CompleteMatchDto extends createZodDto(completeMatchSchema) {}
