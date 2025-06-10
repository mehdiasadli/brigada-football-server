import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const teamSchema = z.object({
  id: z
    .string({
      required_error: 'Team id is required',
      invalid_type_error: 'Team id must be a string',
    })
    .uuid('Invalid team id'),
  createdAt: z.coerce.date({
    required_error: 'Team created at is required',
    invalid_type_error: 'Team created at must be a date',
  }),
  updatedAt: z.coerce.date({
    required_error: 'Team updated at is required',
    invalid_type_error: 'Team updated at must be a date',
  }),
  name: z
    .string({
      required_error: 'Team name is required',
      invalid_type_error: 'Team name must be a string',
    })
    .nullish(),
  matchId: z
    .string({
      required_error: 'Team match id is required',
      invalid_type_error: 'Team match id must be a string',
    })
    .uuid('Invalid match id'),
});

export class Team extends createZodDto(teamSchema) {}
