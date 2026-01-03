import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Post, PostKind, PostVisibility, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';

type PostWithCounts = Post & {
  author: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  _count: {
    likes: number;
    comments: number;
    retweets: number;
  };
};

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimeline(
    limit: number,
    offset: number,
    viewerId?: string,
    type: 'all' | 'following' = 'all',
  ) {
    let whereClause: Prisma.PostWhereInput = {};

    if (type === 'following') {
      if (!viewerId) {
        throw new UnauthorizedException('Unauthorized');
      }
      const followingIds = await this.getFollowingIds(viewerId);
      const filteredIds = followingIds.filter((id) => id !== viewerId);
      whereClause = { authorId: { in: filteredIds } };
    } else {
      whereClause = await this.buildVisibilityWhere(viewerId);
    }

    const [total, posts] = await Promise.all([
      this.prisma.post.count({ where: whereClause }),
      this.prisma.post.findMany({
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
      }),
    ]);

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const mappedItems = await this.mapPosts(items, viewerId);

    return {
      items: mappedItems,
      total,
      limit,
      offset,
      hasMore,
    };
  }

  async createPost(authorId: string, dto: CreatePostDto) {
    const content = dto.content?.trim() ?? '';
    const imageUrl = dto.imageUrl?.trim() ?? '';

    if (!content && !imageUrl) {
      throw new BadRequestException('Content or image is required');
    }

    const post = await this.prisma.post.create({
      data: {
        authorId,
        content: content || null,
        imageUrl: imageUrl || null,
        kind: PostKind.ORIGINAL,
        visibility: dto.visibility ?? PostVisibility.PUBLIC,
      },
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

    const [mapped] = await this.mapPosts([post], authorId);
    return mapped;
  }

  async getPostById(postId: string, viewerId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
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

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const canView = await this.canViewPost(post, viewerId);
    if (!canView) {
      throw new ForbiddenException('Post is private');
    }

    const [mapped] = await this.mapPosts([post], viewerId);
    return mapped;
  }

  async likePost(postId: string, userId: string) {
    await this.ensureCanViewPost(postId, userId);

    try {
      await this.prisma.like.create({
        data: {
          userId,
          postId,
        },
      });
    } catch (error: any) {
      if (error.code !== 'P2002') {
        throw error;
      }
    }

    const likeCount = await this.prisma.like.count({ where: { postId } });
    return { likedByMe: true, likeCount };
  }

  async unlikePost(postId: string, userId: string) {
    await this.ensureCanViewPost(postId, userId);

    try {
      await this.prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } catch (error: any) {
      if (error.code !== 'P2025') {
        throw error;
      }
    }

    const likeCount = await this.prisma.like.count({ where: { postId } });
    return { likedByMe: false, likeCount };
  }

  async retweetPost(postId: string, userId: string) {
    const targetPost = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!targetPost) {
      throw new NotFoundException('Post not found');
    }

    const originalPostId =
      targetPost.kind === PostKind.RETWEET && targetPost.originalPostId
        ? targetPost.originalPostId
        : targetPost.id;

    const originalPost =
      originalPostId === targetPost.id
        ? targetPost
        : await this.prisma.post.findUnique({
            where: { id: originalPostId },
          });

    if (!originalPost) {
      throw new NotFoundException('Post not found');
    }

    const canView = await this.canViewPost(originalPost, userId);
    if (!canView) {
      throw new ForbiddenException('Post is private');
    }

    if (
      originalPost.visibility === PostVisibility.PRIVATE &&
      originalPost.authorId !== userId
    ) {
      throw new BadRequestException('Private posts cannot be retweeted');
    }

    const existing = await this.prisma.post.findFirst({
      where: {
        authorId: userId,
        kind: PostKind.RETWEET,
        originalPostId,
      },
    });

    if (!existing) {
      await this.prisma.post.create({
        data: {
          authorId: userId,
          kind: PostKind.RETWEET,
          originalPostId,
          visibility: PostVisibility.PUBLIC,
        },
      });
    }

    const retweetCount = await this.prisma.post.count({
      where: { originalPostId, kind: PostKind.RETWEET },
    });

    return { retweetedByMe: true, retweetCount };
  }

  async unretweetPost(postId: string, userId: string) {
    const targetPost = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!targetPost) {
      throw new NotFoundException('Post not found');
    }

    const originalPostId =
      targetPost.kind === PostKind.RETWEET && targetPost.originalPostId
        ? targetPost.originalPostId
        : targetPost.id;

    await this.prisma.post.deleteMany({
      where: {
        authorId: userId,
        kind: PostKind.RETWEET,
        originalPostId,
      },
    });

    const retweetCount = await this.prisma.post.count({
      where: { originalPostId, kind: PostKind.RETWEET },
    });

    return { retweetedByMe: false, retweetCount };
  }

  async getComments(
    postId: string,
    limit: number,
    offset: number,
    viewerId?: string,
  ) {
    await this.ensureCanViewPost(postId, viewerId);

    const [total, comments] = await Promise.all([
      this.prisma.comment.count({ where: { postId } }),
      this.prisma.comment.findMany({
        where: { postId },
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
        },
      }),
    ]);

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;

    return {
      items,
      total,
      limit,
      offset,
      hasMore,
    };
  }

  async addComment(postId: string, userId: string, dto: CreateCommentDto) {
    await this.ensureCanViewPost(postId, userId);

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Comment cannot be empty');
    }

    return this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content,
      },
      include: {
        author: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  private async mapPosts(items: PostWithCounts[], viewerId?: string) {
    const postIds = items.map((post) => post.id);
    let likedPostIds = new Set<string>();
    let retweetedPostIds = new Set<string>();

    if (viewerId && postIds.length > 0) {
      const [likes, retweets] = await Promise.all([
        this.prisma.like.findMany({
          where: {
            userId: viewerId,
            postId: { in: postIds },
          },
          select: { postId: true },
        }),
        this.prisma.post.findMany({
          where: {
            authorId: viewerId,
            kind: PostKind.RETWEET,
            originalPostId: { in: postIds },
          },
          select: { originalPostId: true },
        }),
      ]);

      likedPostIds = new Set(likes.map((like) => like.postId));
      retweetedPostIds = new Set(
        retweets
          .map((retweet) => retweet.originalPostId)
          .filter((id): id is string => Boolean(id)),
      );
    }

    return items.map((post) => ({
      ...post,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      retweetCount: post._count.retweets,
      likedByMe: likedPostIds.has(post.id),
      retweetedByMe: retweetedPostIds.has(post.id),
    }));
  }

  private async buildVisibilityWhere(viewerId?: string) {
    if (!viewerId) {
      return { visibility: PostVisibility.PUBLIC };
    }

    const followingIds = await this.getFollowingIds(viewerId);

    return {
      OR: [
        { visibility: PostVisibility.PUBLIC },
        { authorId: viewerId },
        {
          visibility: PostVisibility.PRIVATE,
          authorId: { in: followingIds },
        },
      ],
    } satisfies Prisma.PostWhereInput;
  }

  private async getFollowingIds(viewerId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });

    return follows.map((follow) => follow.followingId);
  }

  private async ensureCanViewPost(postId: string, viewerId?: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const canView = await this.canViewPost(post, viewerId);
    if (!canView) {
      throw new ForbiddenException('Post is private');
    }

    return post;
  }

  private async canViewPost(post: Post, viewerId?: string) {
    if (post.visibility === PostVisibility.PUBLIC) {
      return true;
    }

    if (!viewerId) {
      return false;
    }

    if (post.authorId === viewerId) {
      return true;
    }

    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerId,
          followingId: post.authorId,
        },
      },
    });

    return Boolean(follow);
  }
}
