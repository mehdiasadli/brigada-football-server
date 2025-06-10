import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto, UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Crypt } from 'src/_common/crypt';
import { UserPreferencesService } from 'src/user-preferences/user-preferences.service';
import { User, UserRole } from '@prisma/client';
import { SearchBuilder, SearchDto } from 'src/_common/lib/query.search';
import { OrderBuilder, OrderDto } from 'src/_common/lib/query.order';
import {
  PaginationBuilder,
  PaginationDto,
} from 'src/_common/lib/query.pagination';
import { createMockUsers } from 'src/_common/mock/users';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UserPreferencesService))
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  private publicUser<T extends Partial<User>>(user: T): T {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      avatar: user.avatar,
      updatedAt: user.updatedAt,
      emailVerified: !!user.emailVerifiedAt,
      username: user.username,
      gender: user.gender,
      role: user.role,
      dateOfBirth: user.dateOfBirth,
      placeOfBirth: user.placeOfBirth,
    } as unknown as T;
  }

  async searchUsersForMatch(query: string, excludeIds: string | string[] = []) {
    const trimmedQuery = query.trim().toLowerCase();
    const excludeIdsArray = Array.isArray(excludeIds)
      ? excludeIds
      : [excludeIds];

    return await this.prisma.$queryRaw`
          SELECT 
            id,
            "firstName",
            "lastName", 
            username,
            GREATEST(
              -- Exact matches get highest score
              CASE 
                WHEN LOWER("firstName") = ${trimmedQuery} THEN 1.0
                WHEN LOWER("lastName") = ${trimmedQuery} THEN 1.0
                WHEN LOWER(username) = ${trimmedQuery} THEN 1.0
                WHEN LOWER("firstName" || ' ' || "lastName") = ${trimmedQuery} THEN 1.0
                ELSE 0
              END,
              -- Starts with matches (great for partial typing)
              CASE 
                WHEN LOWER("firstName") LIKE ${trimmedQuery + '%'} THEN 0.9
                WHEN LOWER("lastName") LIKE ${trimmedQuery + '%'} THEN 0.9
                WHEN LOWER(username) LIKE ${trimmedQuery + '%'} THEN 0.85
                WHEN LOWER("firstName" || ' ' || "lastName") LIKE ${trimmedQuery + '%'} THEN 0.8
                ELSE 0
              END,
              -- Contains matches (for middle parts)
              CASE 
                WHEN LOWER("firstName") LIKE ${'%' + trimmedQuery + '%'} THEN 0.7
                WHEN LOWER("lastName") LIKE ${'%' + trimmedQuery + '%'} THEN 0.7
                WHEN LOWER(username) LIKE ${'%' + trimmedQuery + '%'} THEN 0.65
                WHEN LOWER("firstName" || ' ' || "lastName") LIKE ${'%' + trimmedQuery + '%'} THEN 0.6
                ELSE 0
              END,
              -- Trigram similarity (for fuzzy matches like typos)
              GREATEST(
                similarity(LOWER("firstName"), ${trimmedQuery}),
                similarity(LOWER("lastName"), ${trimmedQuery}),
                similarity(LOWER(username), ${trimmedQuery}),
                similarity(LOWER("firstName" || ' ' || "lastName"), ${trimmedQuery})
              ) * 0.5  -- Scale down trigram scores
            ) as relevance_score
          FROM users
          WHERE
            deleted_at IS NULL
            AND id != ALL(${excludeIdsArray})
            AND (
              -- Starts with (catches "hann" → "Hannah")
              LOWER("firstName") LIKE ${trimmedQuery + '%'}
              OR LOWER("lastName") LIKE ${trimmedQuery + '%'}
              OR LOWER(username) LIKE ${trimmedQuery + '%'}
              OR LOWER("firstName" || ' ' || "lastName") LIKE ${trimmedQuery + '%'}
              
              -- Contains (catches partial matches)
              OR LOWER("firstName") LIKE ${'%' + trimmedQuery + '%'}
              OR LOWER("lastName") LIKE ${'%' + trimmedQuery + '%'}
              OR LOWER(username) LIKE ${'%' + trimmedQuery + '%'}
              OR LOWER("firstName" || ' ' || "lastName") LIKE ${'%' + trimmedQuery + '%'}
              
              -- Trigram similarity with lower threshold (catches "hnnh" → "Hannah")
              OR similarity(LOWER("firstName"), ${trimmedQuery}) > 0.2
              OR similarity(LOWER("lastName"), ${trimmedQuery}) > 0.2
              OR similarity(LOWER(username), ${trimmedQuery}) > 0.2
              OR similarity(LOWER("firstName" || ' ' || "lastName"), ${trimmedQuery}) > 0.2
            )
          ORDER BY relevance_score DESC
          LIMIT 10
        `;
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  async findByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: {
        username,
        deletedAt: null,
      },
    });
  }

  async findUsersWithIds(ids: string[]) {
    return await this.prisma.user.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
      },
    });
  }

  async getOneByUsername(username: string) {
    // validate username

    const user = await this.findByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.publicUser(user);
  }

  async findByMobileNumber(mobileNumber: string) {
    return await this.prisma.user.findUnique({
      where: {
        mobileNumber,
        deletedAt: null,
      },
    });
  }

  async createMockUsers(count: number) {
    const users = createMockUsers(count);

    return await Promise.all(users.map((user) => this.create(user)));
  }

  async create(createUserDto: CreateUserDto) {
    // Check for existing email
    const existingEmail = await this.findByEmail(createUserDto.email);

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check for existing username
    const existingUsername = await this.findByUsername(createUserDto.username);

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check for existing mobile number
    const existingMobileNumber = await this.findByMobileNumber(
      createUserDto.mobileNumber,
    );

    if (existingMobileNumber) {
      throw new ConflictException('Mobile number already exists');
    }

    // Encrypt password
    const encryptedPassword = await Crypt.hash(createUserDto.password);

    // Encrypt mobile number
    const encryptedMobileNumber = await Crypt.hash(createUserDto.mobileNumber);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: encryptedPassword,
        mobileNumber: encryptedMobileNumber,
      },
    });

    // Create user preferences
    const userPreferences = await this.userPreferencesService.create({
      userId: user.id,
    });

    // Return user
    return {
      ...this.publicUser(user),
      preferencesId: userPreferences.id,
    };
  }

  async markEmailAsVerified(userId: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async updatePassword(password: string, userId: string) {
    const user = await this.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const encryptedPassword = await Crypt.hash(password);

    return await this.prisma.user.update({
      where: { id: userId },
      data: { password: encryptedPassword },
    });
  }

  async updateRole(
    userId: string,
    updateRoleDto: UpdateRoleDto,
    currentUserId: string,
  ) {
    const currentUser = await this.findOne(currentUserId);
    const user = await this.findOne(userId);

    if (!currentUser) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ruleMap: Record<UserRole, UserRole[]> = {
      [UserRole.SUPER_ADMIN]: [
        UserRole.USER,
        UserRole.MODERATOR,
        UserRole.ADMIN,
      ],
      [UserRole.ADMIN]: [UserRole.USER, UserRole.MODERATOR],
      [UserRole.MODERATOR]: [UserRole.USER],
      [UserRole.USER]: [],
    };

    if (
      !ruleMap[currentUser.role].includes(user.role) ||
      !ruleMap[currentUser.role].includes(updateRoleDto.role)
    ) {
      throw new ForbiddenException('You are not authorized to update role');
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: { role: updateRoleDto.role },
    });
  }

  async findAll(
    paginationDto: PaginationDto,
    orderDto: OrderDto,
    searchDto: SearchDto,
  ) {
    const pagination = new PaginationBuilder(paginationDto);
    const order = new OrderBuilder(orderDto);
    const search = new SearchBuilder(searchDto);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        ...pagination.use(),
        orderBy: order.use(),
        where: {
          deletedAt: null,
          ...search.buildWhere({
            searchableFields: [
              {
                field: 'firstName',
                weight: 1,
              },
              {
                field: 'lastName',
                weight: 1,
              },
              {
                field: 'username',
                weight: 1,
              },
            ],
          }),
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          ...search.buildWhere({
            searchableFields: [
              {
                field: 'firstName',
                weight: 1,
              },
              {
                field: 'lastName',
                weight: 1,
              },
              {
                field: 'username',
                weight: 1,
              },
            ],
          }),
        },
      }),
    ]);

    return pagination.paginate(users, total);
  }

  async findOne(id: string) {
    return await this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async getOneById(id: string) {
    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.publicUser(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return await this.prisma.user.update({
      where: {
        id,
      },
      data: updateUserDto,
    });
  }

  async updateInvalidPasswordAttempts(
    id: string,
    attempts: number = 1,
    type: 'increment' | 'decrement' | 'set' = 'increment',
  ) {
    return await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        invalidPasswordAttempts: {
          [type]: attempts,
        },
      },
    });
  }

  async remove(id: string) {
    return await this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
}
