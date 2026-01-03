import { apiFetch } from './api';
import type { PostItem } from './users';

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentCommentId?: string | null;
  author: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  replies?: CommentItem[];
}

export async function addComment(
  postId: string,
  content: string,
  parentCommentId?: string,
): Promise<CommentItem> {
  return apiFetch<CommentItem>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, parentCommentId }),
  });
}

export async function updatePost(
  postId: string,
  data: { content?: string; imageUrl?: string; visibility?: 'PUBLIC' | 'PRIVATE' },
): Promise<PostItem> {
  return apiFetch<PostItem>(`/api/posts/${postId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function deletePost(postId: string): Promise<void> {
  return apiFetch<void>(`/api/posts/${postId}`, {
    method: 'DELETE',
  });
}

export async function likePost(postId: string): Promise<{ likedByMe: boolean; likeCount: number }> {
  return apiFetch<{ likedByMe: boolean; likeCount: number }>(`/api/posts/${postId}/like`, {
    method: 'POST',
  });
}

export async function unlikePost(postId: string): Promise<{ likedByMe: boolean; likeCount: number }> {
  return apiFetch<{ likedByMe: boolean; likeCount: number }>(`/api/posts/${postId}/like`, {
    method: 'DELETE',
  });
}

export async function retweetPost(postId: string): Promise<{ retweetedByMe: boolean; retweetCount: number }> {
  return apiFetch<{ retweetedByMe: boolean; retweetCount: number }>(`/api/posts/${postId}/retweet`, {
    method: 'POST',
  });
}

export async function unretweetPost(postId: string): Promise<{ retweetedByMe: boolean; retweetCount: number }> {
  return apiFetch<{ retweetedByMe: boolean; retweetCount: number }>(`/api/posts/${postId}/retweet`, {
    method: 'DELETE',
  });
}
