import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimeline(limit: number, offset: number, viewerId?: string, type: 'all' | 'following' = 'all') {
    let whereClause: any = {};

    if (type === 'following' && viewerId) {
      const follows = await this.prisma.follow.findMany({
        where: { followerId: viewerId },
        select: { followingId: true },
      });
      const followingIds = follows.map((f) => f.followingId);
      // Include own posts in "Following" feed? Usually yes, or just followed. 
      // Let's stick to followed users for "Following" feed strictly.
      whereClause = { authorId: { in: followingIds } };
    }

    const posts = await this.prisma.post.findMany({
      where: whereClause,
      take: limit + 1,
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

    // Enhance with viewer state (likedByMe) if needed.
    // Repeating logic from UsersService. Ideally this should be a shared helper or PostsService handles all post retrieval.
    // For now, duplicating the lightweight mapping logic to avoid huge refactor.    
    const postIds = items.map((p) => p.id);
    let likedPostIds = new Set<string>();

    if (viewerId) {
      const likes = await this.prisma.like.findMany({
        where: {
          userId: viewerId,
          postId: { in: postIds },
        },
        select: { postId: true },
      });
      likedPostIds = new Set(likes.map((l) => l.postId));
    }

    const mappedItems = items.map((p) => ({
      ...p,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      retweetCount: p._count.retweets,
      likedByMe: likedPostIds.has(p.id),
    }));

    return {
      items: mappedItems,
      limit,
      offset,
      hasMore,
    };
  }
}
