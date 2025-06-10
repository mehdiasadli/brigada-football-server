import { MatchStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const findFiltersSchema = z.object({
  status: z.nativeEnum(MatchStatus).nullish(),
});

export class FindFiltersDto extends createZodDto(findFiltersSchema) {}
