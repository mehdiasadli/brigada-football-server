import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const idSchema = z.string().uuid();

export class IdDto extends createZodDto(z.object({ id: idSchema })) {}
