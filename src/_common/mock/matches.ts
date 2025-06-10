// Create mock matches using @faker-js/faker
import { faker } from '@faker-js/faker';
import { MatchStatus, PlayerPosition, WeatherCondition } from '@prisma/client';
import { CreateMatchDto } from 'src/matches/dto/create-match.dto';
import { appConfig } from '../config';
import { BadRequestException } from '@nestjs/common';

const exampleTeamNames = [
  'Barcelona',
  'Real Madrid',
  'Manchester United',
  'Liverpool',
  'Chelsea',
  'Arsenal',
  'Manchester City',
  'Tottenham Hotspur',
  'Inter Milan',
  'Bayern Munich',
  'PSG',
  'Juventus',
  'Napoli',
  'Atletico Madrid',
  'Borussia Dortmund',
  'RB Leipzig',
  'Lazio',
  'AC Milan',
  'AS Roma',
  'Napoli',
  'Atletico Madrid',
  'Borussia Dortmund',
];

export const createMockMatches = (count: number): CreateMatchDto[] => {
  if (appConfig.NODE_ENV !== 'development') {
    throw new BadRequestException(
      'Mock matches can only be initiated on development environment',
    );
  }

  return Array.from({ length: count }, () => {
    const status = faker.helpers.arrayElement(Object.values(MatchStatus));
    const startTime =
      status === MatchStatus.COMPLETED
        ? faker.date.past()
        : faker.date.soon({ days: 7 });

    const team1Name = faker.helpers.maybe(
      () => faker.helpers.arrayElement(exampleTeamNames),
      {
        probability: 0.5,
      },
    );
    const team2Name = faker.helpers.maybe(
      () =>
        faker.helpers.arrayElement(
          exampleTeamNames.filter((name) => name !== team1Name),
        ),
      {
        probability: 0.5,
      },
    );

    return {
      duration: faker.number.int({ min: 30, max: 120 }),
      status,
      isPrivate: false,
      description: faker.helpers.maybe(() => faker.lorem.sentence(), {
        probability: 0.5,
      }),
      weatherCondition: faker.helpers.maybe(
        () => faker.helpers.arrayElement(Object.values(WeatherCondition)),
        {
          probability: 0.7,
        },
      ),
      startTime,
      team1: {
        name: team1Name,
        players: createMockPlayers(
          status,
          faker.number.int({ min: 4, max: 7 }),
        ),
      },
      team2: {
        name: team2Name,
        players: createMockPlayers(
          status,
          faker.number.int({ min: 4, max: 7 }),
        ),
      },
    };
  });
};

export function createMockPlayers(
  matchStatus: MatchStatus,
  count: number,
): CreateMatchDto['team1' | 'team2']['players'] {
  const indexOfCaptain = faker.number.int({ min: 0, max: count - 1 });

  return Array.from({ length: count }, (_, index) => {
    return {
      name: faker.person.fullName({ sex: 'male' }),
      goals:
        matchStatus === MatchStatus.COMPLETED
          ? faker.number.int({ min: 0, max: 5 })
          : 0,
      assists:
        matchStatus === MatchStatus.COMPLETED
          ? faker.number.int({ min: 0, max: 5 })
          : 0,
      rating:
        matchStatus === MatchStatus.COMPLETED
          ? faker.number.int({ min: 1, max: 10 })
          : null,
      isCaptain: indexOfCaptain === index,
      positions: faker.helpers.multiple(
        () => faker.helpers.arrayElement(Object.values(PlayerPosition)),
        {
          count: faker.number.int({ min: 1, max: 3 }),
        },
      ),
      userId: null,
    };
  });
}
