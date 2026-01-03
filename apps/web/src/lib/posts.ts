import { apiFetch } from './api';
import type { PostItem } from './users';

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface CommentsResponse {
  items: CommentItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export async function getPostById(postId: string): Promise<PostItem> {
  return apiFetch<PostItem>(`/api/posts/${postId}`);
}

export async function getPostComments(
  postId: string,
  limit = 20,
  offset = 0,
): Promise<CommentsResponse> {
  return apiFetch<CommentsResponse>(
    `/api/posts/${postId}/comments?limit=${limit}&offset=${offset}`,
  );
}

export async function addComment(postId: string, content: string): Promise<CommentItem> {
  return apiFetch<CommentItem>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
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
