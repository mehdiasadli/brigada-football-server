import { Injectable } from '@nestjs/common';
import { LikeType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async getLikeCountOfUser(userId: string) {
    return this.prisma.like.count({
      where: {
        userId,
      },
    });
  }

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

  async togglePostLike(postId: string, currentUserId: string) {
    const like = await this.getLikeOfPost(postId, currentUserId);

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

  async toggleCommentLike(commentId: string, currentUserId: string) {
    const like = await this.getLikeOfComment(commentId, currentUserId);

    if (like) {
      await this.unlikeComment(like.id);

      return {
        type: 'unliked',
      };
    }

    const newLike = await this.likeComment(commentId, currentUserId);

    return {
      type: 'liked',
      like: newLike,
    };
  }

  async getLikeById(id: string) {
    return await this.prisma.like.findUnique({
      where: {
        id,
      },
    });
  }

  async getLikeOfPost(postId: string, userId: string) {
    return await this.prisma.like.findFirst({
      where: {
        userId,
        postId,
      },
    });
  }

  async getLikeOfComment(commentId: string, userId: string) {
    return await this.prisma.like.findFirst({
      where: {
        userId,
        commentId,
      },
    });
  }

  async likePost(postId: string, currentUserId: string) {
    return await this.prisma.like.create({
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

  async likeComment(commentId: string, currentUserId: string) {
    return await this.prisma.like.create({
      data: {
        userId: currentUserId,
        commentId,
        type: LikeType.COMMENT,
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
    return await this.prisma.like.delete({
      where: {
        id: likeId,
      },
    });
  }

  async unlikeComment(likeId: string) {
    return await this.prisma.like.delete({
      where: {
        id: likeId,
      },
    });
  }
}
