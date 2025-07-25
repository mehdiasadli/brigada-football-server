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
import { MatchStatus, User, UserRole } from '@prisma/client';
import { SearchBuilder, SearchDto } from 'src/_common/lib/query.search';
import { OrderBuilder, OrderDto } from 'src/_common/lib/query.order';
import {
  PaginationBuilder,
  PaginationDto,
} from 'src/_common/lib/query.pagination';
import { createMockUsers } from 'src/_common/mock/users';
import { FriendshipsService } from 'src/friendships/friendships.service';
import {
  CloudinaryImage,
  CloudinaryService,
} from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UserPreferencesService))
    private readonly userPreferencesService: UserPreferencesService,
    @Inject(forwardRef(() => FriendshipsService))
    private readonly friendshipsService: FriendshipsService,
    private readonly cloudinaryService: CloudinaryService,
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

  async deleteAvatar(currentUserId: string) {
    const user = await this.findOne(currentUserId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.avatar) {
      return true;
    }

    await this.cloudinaryService.deleteImagesByUrls([user.avatar]);

    return await this.prisma.user.update({
      where: { id: user.id },
      data: { avatar: null },
    });
  }

  async uploadAvatar(file: Express.Multer.File, currentUserId: string) {
    const user = await this.findOne(currentUserId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.cloudinaryService.validateImageFile(file);

    let avatar: CloudinaryImage | null = null;

    if (user.avatar) {
      // replace avatar
      avatar = await this.replaceAvatar(file, user.avatar, user.id);
    } else {
      avatar = await this.createAvatar(file, user.id);
    }

    return await this.prisma.user.update({
      where: { id: user.id },
      data: { avatar: avatar.secureUrl },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        role: true,
        avatar: true,
      },
    });
  }

  async replaceAvatar(
    file: Express.Multer.File,
    oldAvatarUrl: string | null,
    userId: string,
  ) {
    return await this.cloudinaryService.replaceAvatar(
      oldAvatarUrl,
      file.buffer,
      file.originalname,
      userId,
    );
  }

  async createAvatar(file: Express.Multer.File, userId: string) {
    return await this.cloudinaryService.uploadAvatar(
      file.buffer,
      file.originalname,
      userId,
    );
  }

  async globalSearch(query: string, currentUserId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        NOT: {
          id: currentUserId,
        },
        OR: [
          {
            firstName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
      },
      take: 3,
    });

    return users.map((user) => ({
      item: user,
      type: 'user' as const,
    }));
  }

  async getCreatedChart() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const startDate = new Date(currentYear - 1, currentMonth - 1, 1);
    const endDate = new Date(
      currentYear,
      currentMonth - 1,
      now.getDate(),
      23,
      59,
      59,
    );

    const usersCreated = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    const usersWhoCreatedMatches = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        createdMatches: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    const usersWhoPlayedMatches = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        played: {
          some: {
            team: {
              match: {
                status: MatchStatus.COMPLETED,
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    const monthlyData: any[] = [];

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - 1 - i, 1);
      const targetMonth = targetDate.getMonth() + 1; // Convert to 1-12
      const targetYear = targetDate.getFullYear();

      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59); // Last day of month

      const usersCreatedCount = usersCreated.filter((user) => {
        const userCreatedAt = new Date(user.createdAt);
        return userCreatedAt >= monthStart && userCreatedAt <= monthEnd;
      }).length;

      const usersWhichHaveCreatedMatch = usersWhoCreatedMatches.filter(
        (user) => {
          const userCreatedAt = new Date(user.createdAt);
          return userCreatedAt >= monthStart && userCreatedAt <= monthEnd;
        },
      ).length;

      const usersWhichHavePlayedMatch = usersWhoPlayedMatches.filter((user) => {
        const userCreatedAt = new Date(user.createdAt);
        return userCreatedAt >= monthStart && userCreatedAt <= monthEnd;
      }).length;

      monthlyData.push({
        month: targetMonth,
        usersCreatedCount,
        usersWhichHaveCreatedMatch,
        usersWhichHavePlayedMatch,
      });
    }

    return monthlyData;
  }

  async getUserActivityPoints(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        _count: {
          select: {
            comments: true,
            likes: true,
            posts: true,
            played: {
              where: {
                team: {
                  match: {
                    status: MatchStatus.COMPLETED,
                  },
                },
              },
            },
            createdMatches: {
              where: {
                status: MatchStatus.COMPLETED,
              },
            },
            createdVenues: {
              where: {
                matches: {
                  some: {
                    status: MatchStatus.COMPLETED,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const weights = {
      posts: 5,
      comments: 2,
      likes: 1,
      createdMatches: 10,
      played: 5,
      createdVenues: 12,
    } as const;

    let points = 0;

    for (const [key, value] of Object.entries(weights)) {
      points += user._count[key] * value;
    }

    return points;
  }

  async getUsersStats() {
    const totalUsers = await this.prisma.user.count({
      where: {
        deletedAt: null,
      },
    });

    const usersInThisMonth = await this.prisma.user.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    const usersInLastMonth = await this.prisma.user.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 2)),
          lte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    return {
      totalUsers,
      usersInThisMonth,
      usersInLastMonth,
    };
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

  async getOneByUsername(username: string, currentUserId: string) {
    const user = await this.findByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const friendship = await this.friendshipsService.getFriendshipWithIds(
      currentUserId,
      user.id,
    );

    const friendshipData = !friendship
      ? null
      : {
          id: friendship.id,
          status: friendship.status,
          side:
            friendship.requesterId === currentUserId ? 'requester' : 'receiver',
        };

    return {
      ...this.publicUser(user),
      friendship: friendshipData,
    };
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
        omit: {
          password: true,
          updatedAt: true,
          deletedAt: true,
          mobileNumber: true,
        },
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

    const usersWithActivityPoints = await Promise.all(
      users.map(async (user) => {
        const activityPoints = await this.getUserActivityPoints(user.id);

        return {
          ...user,
          activity: activityPoints,
        };
      }),
    );

    return pagination.paginate(usersWithActivityPoints, total);
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

  private canDeleteUser(
    currentUserRole: UserRole,
    targetUserRole: UserRole,
    currentUserId: string,
    targetUserId: string,
  ) {
    const isSelfDelete = currentUserId === targetUserId;

    switch (currentUserRole) {
      case UserRole.USER:
      case UserRole.MODERATOR:
        return isSelfDelete;
      case UserRole.ADMIN:
        if (isSelfDelete) return true;
        return (
          targetUserRole === UserRole.USER ||
          targetUserRole === UserRole.MODERATOR
        );
      case UserRole.SUPER_ADMIN:
        if (isSelfDelete) return true;
        return targetUserRole !== UserRole.SUPER_ADMIN;
      default:
        return false;
    }
  }

  async delete(id: string, currentUserId: string) {
    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const currentUser = await this.findOne(currentUserId);

    if (!currentUser) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (!this.canDeleteUser(currentUser.role, user.role, currentUserId, id)) {
      throw new ForbiddenException(
        'You are not authorized to delete this user',
      );
    }

    return await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // full removing
  async remove(id: string) {
    return await this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
}
