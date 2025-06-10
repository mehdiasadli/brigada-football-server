import { faker } from '@faker-js/faker';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { regexes } from '../resources/regexes';
import { Gender, UserRole } from '@prisma/client';
import { appConfig } from '../config';
import { BadRequestException } from '@nestjs/common';

export function createMockUsers(
  count: number,
): (CreateUserDto & { emailVerifiedAt: Date; role: UserRole })[] {
  // security
  // only can be initiated on dev environment

  if (appConfig.NODE_ENV !== 'development') {
    throw new BadRequestException(
      'Mock users can only be initiated on development environment',
    );
  }

  return Array.from({ length: count }, () => {
    const gender = faker.helpers.arrayElement(Object.values(Gender));
    const email = faker.internet.email().toLowerCase();
    const password = faker.internet.password({
      length: 9,
      memorable: true,
      pattern: regexes.users.password,
    });
    const role = faker.helpers.weightedArrayElement([
      { value: UserRole.ADMIN, weight: 2 },
      { value: UserRole.USER, weight: 5 },
      { value: UserRole.MODERATOR, weight: 2 },
      { value: UserRole.SUPER_ADMIN, weight: 1 },
    ]);

    // log the login credentials
    console.log(`${email} / ${password} / ${role}`);

    return {
      email,
      username: faker.internet.username().toLowerCase(),
      password,
      firstName: faker.person.firstName(
        gender === Gender.MALE ? 'male' : 'female',
      ),
      lastName: faker.person.lastName(
        gender === Gender.MALE ? 'male' : 'female',
      ),
      emailVerifiedAt: faker.date.recent(),
      mobileNumber: faker.helpers.fromRegExp(
        new RegExp(
          `^994(${appConfig.MOBILE_NUMBER_OPERATORS.join('|')})([1-9]\\d{6})$`,
        ),
      ),
      dateOfBirth: new Date('2001-10-10'),
      gender,
      placeOfBirth: faker.location.city(),
      role,
    };
  });
}
