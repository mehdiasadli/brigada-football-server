import { VenueType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const venueSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string().min(1),
  address: z.string().min(1),
  addressDescription: z.string().nullish(),
  hasParking: z.boolean().default(false),
  hasShowers: z.boolean().default(true),
  type: z.nativeEnum(VenueType),
  pricePerHour: z.number().positive(),
  contactName: z.string().nullish(),
  contactPhone: z.string().nullish(),
  latitude: z.number(),
  longitude: z.number(),
  creatorId: z.string().uuid().nullish(),
});

export class Venue extends createZodDto(venueSchema) {}
