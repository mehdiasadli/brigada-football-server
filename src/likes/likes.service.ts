import { Injectable } from '@nestjs/common';
import { LikeType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async getLikesOfPost(postId: string) {
    return this.prisma.like.findMany({
      where: {
        postId,
      },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }
  async getLikesOfComment(commentId: string) {
    return this.prisma.like.findMany({
      where: {
        commentId,
      },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async toggleLike(postId: string, currentUserId: string) {
    const like = await this.getLike(postId, currentUserId);

    if (like) {
      await this.unlikePost(like.id);

      return {
        type: 'unliked',
      };
    }

    const newLike = await this.likePost(postId, currentUserId);

    return {
      type: 'liked',
      like: newLike,
    };
  }

  async getLikeById(id: string) {
    return this.prisma.like.findUnique({
      where: {
        id,
      },
    });
  }

  async getLike(postId: string, userId: string) {
    return this.prisma.like.findFirst({
      where: {
        userId,
        postId,
      },
    });
  }

  async likePost(postId: string, currentUserId: string) {
    return this.prisma.like.create({
      data: {
        userId: currentUserId,
        postId,
        type: LikeType.POST,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async unlikePost(likeId: string) {
    return this.prisma.like.delete({
      where: {
        id: likeId,
      },
    });
  }
}
