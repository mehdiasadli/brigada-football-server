import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserPreferenceDto } from './dto/create-user-preference.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserPreferenceDto: CreateUserPreferenceDto) {
    const existingUserPreference = await this.prisma.userPreferences.findUnique(
      {
        where: {
          userId: createUserPreferenceDto.userId,
        },
      },
    );

    if (existingUserPreference) {
      throw new ConflictException('User preference already exists');
    }

    const userPreference = await this.prisma.userPreferences.create({
      data: createUserPreferenceDto,
    });

    return userPreference;
  }
}
