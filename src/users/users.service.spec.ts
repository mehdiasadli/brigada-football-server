/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserStatsService } from 'src/user-stats/user-stats.service';
import { UserPreferencesService } from 'src/user-preferences/user-preferences.service';
import { Crypt } from 'src/_common/crypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Gender } from '@prisma/client';

// Mock Crypt module
jest.mock('src/_common/crypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let userStatsService: UserStatsService;
  let userPreferencesService: UserPreferencesService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    mobileNumber: 'hashedMobileNumber',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    emailVerifiedAt: null,
    invalidPasswordAttempts: 0,
  };

  const mockUserStats = {
    id: 'stats-123',
    userId: mockUser.id,
  };

  const mockUserPreferences = {
    id: 'preferences-123',
    userId: mockUser.id,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUserStatsService = {
    create: jest.fn(),
  };

  const mockUserPreferencesService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UserStatsService,
          useValue: mockUserStatsService,
        },
        {
          provide: UserPreferencesService,
          useValue: mockUserPreferencesService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    userStatsService = module.get<UserStatsService>(UserStatsService);
    userPreferencesService = module.get<UserPreferencesService>(
      UserPreferencesService,
    );

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          deletedAt: null,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          username: 'testuser',
          deletedAt: null,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByMobileNumber', () => {
    it('should find user by mobile number', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByMobileNumber('1234567890');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          mobileNumber: '1234567890',
          deletedAt: null,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByMobileNumber('0000000000');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      mobileNumber: '1234567890',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: new Date('1990-01-01'),
      placeOfBirth: 'New York',
      gender: Gender.FEMALE,
    };

    beforeEach(() => {
      // Mock Crypt.hash to return predictable values
      (Crypt.hash as jest.Mock)
        .mockResolvedValueOnce('hashedPassword')
        .mockResolvedValueOnce('hashedMobileNumber');
    });

    it('should create a new user successfully', async () => {
      // Mock that no existing users are found
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockUserStatsService.create.mockResolvedValue(mockUserStats);
      mockUserPreferencesService.create.mockResolvedValue(mockUserPreferences);

      const result = await service.create(createUserDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(3); // email, username, mobile
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          password: 'hashedPassword',
          mobileNumber: 'hashedMobileNumber',
        },
      });
      expect(userStatsService.create).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
      expect(userPreferencesService.create).toHaveBeenCalledWith({
        userId: mockUser.id,
      });

      expect(result).toEqual({
        id: mockUser.id,
        statsId: mockUserStats.id,
        preferencesId: mockUserPreferences.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser); // email check

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(mockUser); // username check

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Username already exists'),
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if mobile number already exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce(mockUser); // mobile number check

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Mobile number already exists'),
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(3);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('markEmailAsVerified', () => {
    it('should mark email as verified', async () => {
      const now = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      const updatedUser = { ...mockUser, emailVerifiedAt: now };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.markEmailAsVerified(mockUser.id);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { emailVerifiedAt: now },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updatePassword', () => {
    it('should update user password successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (Crypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const updatedUser = { ...mockUser, password: 'newHashedPassword' };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updatePassword('newPassword', mockUser.id);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(Crypt.hash).toHaveBeenCalledWith('newPassword');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { password: 'newHashedPassword' },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePassword('newPassword', 'nonexistent-id'),
      ).rejects.toThrow(new NotFoundException('User not found'));

      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, { ...mockUser, id: 'user2' }];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(prismaService.user.findMany).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should find user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'UpdatedJohn',
        lastName: 'UpdatedDoe',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateUserDto);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateUserDto,
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updateInvalidPasswordAttempts', () => {
    it('should increment invalid password attempts by default', async () => {
      const updatedUser = { ...mockUser, invalidPasswordAttempts: 1 };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateInvalidPasswordAttempts(mockUser.id);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          invalidPasswordAttempts: {
            increment: 1,
          },
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should increment by custom amount', async () => {
      const updatedUser = { ...mockUser, invalidPasswordAttempts: 3 };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateInvalidPasswordAttempts(
        mockUser.id,
        3,
        'increment',
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          invalidPasswordAttempts: {
            increment: 3,
          },
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should decrement invalid password attempts', async () => {
      const updatedUser = { ...mockUser, invalidPasswordAttempts: -1 };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateInvalidPasswordAttempts(
        mockUser.id,
        1,
        'decrement',
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          invalidPasswordAttempts: {
            decrement: 1,
          },
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should set invalid password attempts to specific value', async () => {
      const updatedUser = { ...mockUser, invalidPasswordAttempts: 5 };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateInvalidPasswordAttempts(
        mockUser.id,
        5,
        'set',
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          invalidPasswordAttempts: {
            set: 5,
          },
        },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(mockUser.id);

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
