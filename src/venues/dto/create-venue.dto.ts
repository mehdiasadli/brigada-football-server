import { createZodDto } from 'nestjs-zod';
import { venueSchema } from '../entities/venue.entity';

export const createVenueSchema = venueSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  creatorId: true,
});

export class CreateVenueDto extends createZodDto(createVenueSchema) {}
