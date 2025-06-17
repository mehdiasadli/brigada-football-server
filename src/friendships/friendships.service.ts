import {
  BadRequestException,
  forwardRef,
  Inject,
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
    @Inject(forwardRef(() => UsersService))
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

  async getFriendshipRequests(currentUserId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.PENDING,
        receiverId: currentUserId,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            username: true,
          },
        },
      },
    });

    return requests;
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
            username: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            username: true,
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
    // Prevent self-friendship
    if (friendId === currentUserId) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself',
      );
    }

    const friend = await this.usersService.findOne(friendId);

    if (!friend) {
      throw new NotFoundException('Friend not found');
    }

    const existingFriendship = await this.getFriendshipWithIds(
      currentUserId,
      friendId,
    );

    if (existingFriendship) {
      // Check current status
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('You are already friends');
      }

      if (existingFriendship.status === FriendshipStatus.BLOCKED) {
        throw new BadRequestException(
          'You cannot send a friendship request to a blocked user',
        );
      }

      if (existingFriendship.status === FriendshipStatus.PENDING) {
        // Check who sent the original request
        if (existingFriendship.requesterId === currentUserId) {
          throw new BadRequestException('Friendship request already sent');
        } else {
          // The other person sent a request to current user - auto accept
          return await this.acceptFriendshipRequest(
            existingFriendship.id,
            currentUserId,
          );
        }
      }

      // For REJECTED or CANCELED status, create a new request with current user as requester
      if (
        existingFriendship.status === FriendshipStatus.REJECTED ||
        existingFriendship.status === FriendshipStatus.CANCELED
      ) {
        // Delete the old friendship record and create a new one
        await this.prisma.friendship.delete({
          where: { id: existingFriendship.id },
        });

        const newFriendship = await this.createFriendship(
          currentUserId,
          friendId,
          FriendshipStatus.PENDING,
        );

        return newFriendship;
      }
    }

    // No existing friendship - create new one
    const newFriendship = await this.createFriendship(
      currentUserId,
      friendId,
      FriendshipStatus.PENDING,
    );

    return newFriendship;
  }

  // cancel friendship request
  async cancelFriendshipRequest(id: string, currentUserId: string) {
    const friendship = await this.getFriendshipWithId(id);

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // only requester can cancel
    if (friendship.requesterId !== currentUserId) {
      throw new BadRequestException(
        'You cannot cancel this friendship request',
      );
    }

    // Only allow canceling PENDING requests
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException(
        'You can only cancel pending friendship requests',
      );
    }

    return await this.updateStatus(id, FriendshipStatus.CANCELED);
  }

  // reject friendship request
  async rejectFriendshipRequest(id: string, currentUserId: string) {
    const friendship = await this.getFriendshipWithId(id);

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // only receiver can reject
    if (friendship.receiverId !== currentUserId) {
      throw new BadRequestException(
        'You cannot reject this friendship request',
      );
    }

    // Only allow rejecting PENDING requests
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException(
        'You can only reject pending friendship requests',
      );
    }

    return await this.updateStatus(id, FriendshipStatus.REJECTED);
  }

  // accept friendship request
  async acceptFriendshipRequest(id: string, currentUserId: string) {
    const friendship = await this.getFriendshipWithId(id);

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // only receiver can accept
    if (friendship.receiverId !== currentUserId) {
      throw new BadRequestException(
        'You cannot accept this friendship request',
      );
    }

    // Only allow accepting PENDING requests
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException(
        'You can only accept pending friendship requests',
      );
    }

    return await this.updateStatus(id, FriendshipStatus.ACCEPTED);
  }

  // remove friend (for accepted friendships)
  async removeFriend(friendId: string, currentUserId: string) {
    const friendship = await this.getFriendshipWithIds(currentUserId, friendId);

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    if (friendship.status !== FriendshipStatus.ACCEPTED) {
      throw new BadRequestException('You are not friends with this user');
    }

    // Delete the friendship entirely
    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { message: 'Friend removed successfully' };
  }

  // block user
  async blockUser(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const existingFriendship = await this.getFriendshipWithIds(
      currentUserId,
      userId,
    );

    if (existingFriendship) {
      // Update existing friendship to blocked
      return await this.updateStatus(
        existingFriendship.id,
        FriendshipStatus.BLOCKED,
      );
    } else {
      // Create new friendship with blocked status
      return await this.createFriendship(
        currentUserId,
        userId,
        FriendshipStatus.BLOCKED,
      );
    }
  }

  // unblock user
  async unblockUser(userId: string, currentUserId: string) {
    const friendship = await this.getFriendshipWithIds(currentUserId, userId);

    if (!friendship) {
      throw new NotFoundException('No relationship found with this user');
    }

    if (friendship.status !== FriendshipStatus.BLOCKED) {
      throw new BadRequestException('This user is not blocked');
    }

    // Only the blocker can unblock
    if (friendship.requesterId !== currentUserId) {
      throw new BadRequestException('You cannot unblock this user');
    }

    // Delete the blocked relationship
    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { message: 'User unblocked successfully' };
  }

  // get friendship status between two users
  async getFriendshipStatus(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      return { status: 'self' };
    }

    const friendship = await this.getFriendshipWithIds(currentUserId, userId);

    if (!friendship) {
      return { status: 'none' };
    }

    return {
      status: friendship.status.toLowerCase(),
      friendshipId: friendship.id,
      isRequester: friendship.requesterId === currentUserId,
      isReceiver: friendship.receiverId === currentUserId,
    };
  }

  async updateStatus(id: string, status: FriendshipStatus) {
    const friendship = await this.prisma.friendship.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(), // Ensure updatedAt is updated
      },
    });

    return friendship;
  }
}
