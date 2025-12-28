import { apiFetch } from './api';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface PostItem {
  id: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  author: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  likeCount: number;
  commentCount: number;
  retweetCount: number;
  likedByMe: boolean;
}

export interface PostsResponse {
  items: PostItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export async function getUserProfile(username: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/api/users/${username}`);
}

export async function getUserPosts(
  username: string,
  limit = 20,
  offset = 0,
): Promise<PostsResponse> {
  return apiFetch<PostsResponse>(
    `/api/users/${username}/posts?limit=${limit}&offset=${offset}`,
  );
}

export async function followUser(username: string): Promise<{ isFollowing: boolean }> {
  return apiFetch<{ isFollowing: boolean }>(`/api/users/${username}/follow`, {
    method: 'POST',
  });
}

export async function unfollowUser(username: string): Promise<{ isFollowing: boolean }> {
  return apiFetch<{ isFollowing: boolean }>(`/api/users/${username}/follow`, {
    method: 'DELETE',
  });
}

export interface UpdateProfileInput {
  email?: string;
  password?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export async function updateProfile(data: UpdateProfileInput): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/users/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function getTimeline(limit = 20, offset = 0, type: 'all' | 'following' = 'all'): Promise<PostsResponse> {
  return apiFetch<PostsResponse>(`/api/posts?limit=${limit}&offset=${offset}&type=${type}`);
}
