/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PostKind, PostVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
  displayName?: string | null;
}

type UserRecord = {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    followers: number;
    following: number;
    posts: number;
  };
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return user as UserRecord | null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    return user as UserRecord | null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user as UserRecord | null;
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        passwordHash: input.passwordHash,
        displayName: input.displayName,
      },
    });

    return user as UserRecord;
  }

  async updateUser(id: string, data: Partial<UserRecord> & { password?: string }) {
    const currentUser = await this.findById(id);
    if (!currentUser) throw new Error('User not found');

    if (data.email && data.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      const existing = await this.findByEmail(data.email);
      if (existing) {
        throw new Error('Email already in use');
      }
    }

    if (data.username && data.username.toLowerCase() !== currentUser.username.toLowerCase()) {
      const existing = await this.findByUsername(data.username);
      if (existing) {
        throw new Error('Username already in use');
      }
    }

    let passwordHash = undefined;
    if (data.password) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const bcrypt = require('bcrypt');
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    const { password, ...updateData } = data; // remove raw password

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });

    return user as UserRecord;
  }

  async getProfile(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    let isFollowing = false;
    let canViewPrivate = false;
    if (viewerId && viewerId !== user.id) {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
      canViewPrivate = isFollowing;
    } else if (viewerId === user.id) {
      canViewPrivate = true;
    }

    const postsCount = await this.prisma.post.count({
      where: {
        authorId: user.id,
        ...(canViewPrivate ? {} : { visibility: PostVisibility.PUBLIC }),
      },
    });

    return {
      ...user,
      postsCount,
      followersCount: user._count?.followers ?? 0,
      followingCount: user._count?.following ?? 0,
      isFollowing,
    };
  }

  async getUserPosts(
    username: string,
    limit: number,
    offset: number,
    viewerId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
      },
    });

    if (!user) {
      return null;
    }

    const canViewPrivate =
      viewerId ? await this.canViewPrivatePosts(viewerId, user.id) : false;

    const whereClause = {
      authorId: user.id,
      ...(canViewPrivate ? {} : { visibility: PostVisibility.PUBLIC }),
    };

    const total = await this.prisma.post.count({ where: whereClause });

    // Stable ordering by createdAt desc, then id desc
    const posts = await this.prisma.post.findMany({
      where: whereClause,
      take: limit + 1, // Fetch one extra to check hasMore
      skip: offset,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            retweets: true,
          },
        },
      },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    // Enhance with viewer state (likedByMe, etc.) - minimal implementation for now
    // If needed, we'd do a second query or include based on viewerId
    // For this scope, let's keep it simple as per requirements.
    // "Items are Post[] ... viewer flags if already defined"

    // To implement viewer flags efficiently:
    const postIds = items.map((p) => p.id);
    let likedPostIds = new Set<string>();
    let retweetedPostIds = new Set<string>();

    if (viewerId) {
      const likes = await this.prisma.like.findMany({
        where: {
          userId: viewerId,
          postId: { in: postIds },
        },
        select: { postId: true },
      });
      likedPostIds = new Set(likes.map((l) => l.postId));
      const retweets = await this.prisma.post.findMany({
        where: {
          authorId: viewerId,
          kind: PostKind.RETWEET,
          originalPostId: { in: postIds },
        },
        select: { originalPostId: true },
      });
      retweetedPostIds = new Set(
        retweets
          .map((retweet) => retweet.originalPostId)
          .filter((id): id is string => Boolean(id)),
      );
    }

    const mappedItems = items.map((p) => ({
      ...p,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      retweetCount: p._count.retweets,
      likedByMe: likedPostIds.has(p.id),
      retweetedByMe: retweetedPostIds.has(p.id),
    }));

    return {
      items: mappedItems,
      total,
      limit,
      offset,
      hasMore,
    };
  }

  private async canViewPrivatePosts(viewerId: string, userId: string) {
    if (viewerId === userId) {
      return true;
    }

    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerId,
          followingId: userId,
        },
      },
    });

    return Boolean(follow);
  }

  async followUser(followerId: string, followingUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: followingUsername.toLowerCase() },
    });

    if (!targetUser) {
      return { notFound: true };
    }

    if (targetUser.id === followerId) {
      return { selfFollow: true };
    }

    try {
      await this.prisma.follow.create({
        data: {
          followerId,
          followingId: targetUser.id,
        },
      });
      return { success: true };
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2002') {
        return { alreadyFollowing: true };
      }
      throw error;
    }
  }

  async unfollowUser(followerId: string, followingUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: followingUsername.toLowerCase() },
    });

    if (!targetUser) {
      return { notFound: true };
    }

    try {
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUser.id,
          },
        },
      });
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2025') {
        // Record not found, ignore
        return { success: true };
      }
      throw error;
    }

    return { success: true };
  }
}
