import { createZodDto } from 'nestjs-zod';
import { createVenueSchema } from './create-venue.dto';

export const updateVenueSchema = createVenueSchema.partial();

export class UpdateVenueDto extends createZodDto(updateVenueSchema) {}
