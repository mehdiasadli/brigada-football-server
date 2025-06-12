import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FriendshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async getFriendshipWithIds(userId: string, friendId: string) {
    return await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: friendId },
          { requesterId: friendId, receiverId: userId },
        ],
      },
    });
  }

  async getFriendsOfUser(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    });

    const friends = friendships.map((friendship) => {
      return friendship.requesterId === userId
        ? friendship.receiver
        : friendship.requester;
    });

    return friends;
  }

  async getFriendshipWithId(id: string) {
    return await this.prisma.friendship.findFirst({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    });
  }

  async createFriendship(
    userId: string,
    friendId: string,
    status: FriendshipStatus = FriendshipStatus.PENDING,
  ) {
    return await this.prisma.friendship.create({
      data: {
        requesterId: userId,
        receiverId: friendId,
        status,
      },
    });
  }

  // send friendship request
  async sendFriendshipRequest(friendId: string, currentUserId: string) {
    const friend = await this.usersService.findOne(friendId);

    if (!friend) {
      throw new NotFoundException('Friend not found');
    }

    const existingFriendship = await this.getFriendshipWithIds(
      currentUserId,
      friendId,
    );

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('Friendship already exists');
      }

      if (existingFriendship.status === FriendshipStatus.BLOCKED) {
        throw new BadRequestException(
          'You cannot send a friendship request to a blocked user',
        );
      }

      if (existingFriendship.status === FriendshipStatus.PENDING) {
        throw new BadRequestException('Friendship request already sent');
      }

      return await this.updateStatus(
        existingFriendship.id,
        FriendshipStatus.PENDING,
      );
    }

    return await this.createFriendship(
      currentUserId,
      friendId,
      FriendshipStatus.PENDING,
    );
  }

  // cancel friendship request
  async cancelFriendshipRequest(id: string, currentUserId: string) {
    const friendship = await this.getFriendshipWithIds(id, currentUserId);

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // only requester can cancel
    if (friendship.requesterId !== currentUserId) {
      throw new BadRequestException(
        'You cannot cancel this friendship request',
      );
    }

    return await this.updateStatus(id, FriendshipStatus.CANCELED);
  }

  // reject friendship request
  async rejectFriendshipRequest(id: string, currentUserId: string) {
    const friendship = await this.getFriendshipWithIds(id, currentUserId);

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // only receiver can reject
    if (friendship.receiverId !== currentUserId) {
      throw new BadRequestException(
        'You cannot reject this friendship request',
      );
    }

    return await this.updateStatus(id, FriendshipStatus.REJECTED);
  }

  // accept friendship request
  async acceptFriendshipRequest(id: string, currentUserId: string) {
    const friendship = await this.getFriendshipWithIds(id, currentUserId);

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // only receiver can accept
    if (friendship.receiverId !== currentUserId) {
      throw new BadRequestException(
        'You cannot accept this friendship request',
      );
    }

    return await this.updateStatus(id, FriendshipStatus.ACCEPTED);
  }

  async updateStatus(id: string, status: FriendshipStatus) {
    const friendship = await this.prisma.friendship.update({
      where: { id },
      data: { status },
    });

    return friendship;
  }
}
