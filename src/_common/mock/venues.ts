import { faker } from '@faker-js/faker';
import { VenueType } from '@prisma/client';
import { CreateVenueDto } from 'src/venues/dto/create-venue.dto';
import { appConfig } from '../config';
import { BadRequestException } from '@nestjs/common';

const VenueTypes = [
  VenueType.INDOOR,
  VenueType.OUTDOOR,
  VenueType.INDOOR_OUTDOOR,
];

export const createMockVenues = (count: number): CreateVenueDto[] => {
  if (appConfig.NODE_ENV !== 'development') {
    throw new BadRequestException(
      'Mock venues can only be initiated on development environment',
    );
  }

  return Array.from({ length: count }, () => {
    return {
      name: faker.company.name(),
      address: faker.location.streetAddress(),
      addressDescription: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.4,
      }),
      hasParking: faker.datatype.boolean(),
      hasShowers: faker.datatype.boolean(),
      type: faker.helpers.arrayElement(Object.values(VenueTypes)),
      pricePerHour: faker.number.int({ min: 40, max: 120 }),
      latitude: faker.location.latitude({
        min: 40.3,
        max: 40.45,
      }),
      longitude: faker.location.longitude({
        min: 49.8,
        max: 49.95,
      }),
      contactName: faker.helpers.maybe(() => faker.person.fullName(), {
        probability: 0.4,
      }),
      contactPhone: faker.helpers.maybe(
        () =>
          faker.phone.number({
            style: 'international',
          }),
        {
          probability: 0.9,
        },
      ),
    };
  });
};
