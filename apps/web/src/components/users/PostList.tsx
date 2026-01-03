'use client';

import { useEffect, useState } from 'react';
import { Heart, Lock, MessageCircle, Repeat2 } from 'lucide-react';
import { getUserPosts, getTimeline, PostItem } from '../../lib/users';

interface PostListProps {
  username?: string; // Optional: if type is 'user'
  type?: 'user' | 'timeline' | 'following';
}

export function PostList({ username, type = 'user' }: PostListProps) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async (reset = false) => {
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      let response;

      if (type === 'user' && username) {
        response = await getUserPosts(username, 20, currentOffset);
      } else if (type === 'following') {
        response = await getTimeline(20, currentOffset, 'following');
      } else {
        response = await getTimeline(20, currentOffset, 'all');
      }

      if (reset) {
        setPosts(response.items);
      } else {
        setPosts((prev) => [...prev, ...response.items]);
      }

      setHasMore(response.hasMore);
      setOffset(currentOffset + response.items.length);
      setError(null);
    } catch (err) {
      setError('Failed to load posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, type]);

  if (loading && posts.length === 0) {
    return <div className="text-center py-10 text-gray-500">Loading posts...</div>;
  }

  if (error && posts.length === 0) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400 background-secondary rounded-lg">
        No posts yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
          <div className="flex items-start space-x-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                post.author.avatarUrl ||
                `https://ui-avatars.com/api/?name=${post.author.username}`
              }
              alt={post.author.username}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900 dark:text-white truncate">
                  {post.author.displayName || post.author.username}
                </span>
                <span className="text-sm text-gray-500 truncate">
                  @{post.author.username}
                </span>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-sm text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
                {post.visibility === 'PRIVATE' && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    <Lock size={12} />
                    Private
                  </span>
                )}
              </div>

              {post.content && (
                <p className="mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {post.content}
                </p>
              )}

              {post.imageUrl && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt="Post content"
                    className="rounded-lg max-h-96 object-cover bg-gray-100 dark:bg-zinc-800"
                  />
                </div>
              )}

              <div className="mt-4 flex items-center space-x-6 text-gray-500 text-sm">
                <button
                  className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
                  type="button"
                  aria-label="Comments"
                >
                  <MessageCircle size={16} />
                  <span>{post.commentCount}</span>
                </button>
                <button
                  className={`flex items-center space-x-1 transition-colors ${
                    post.retweetedByMe ? 'text-green-600' : 'hover:text-green-500'
                  }`}
                  type="button"
                  aria-label="Retweets"
                >
                  <Repeat2 size={16} />
                  <span>{post.retweetCount}</span>
                </button>
                <button
                  className={`flex items-center space-x-1 transition-colors ${
                    post.likedByMe ? 'text-red-500' : 'hover:text-red-500'
                  }`}
                  type="button"
                  aria-label="Likes"
                >
                  <Heart size={16} />
                  <span>{post.likeCount}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={() => fetchPosts()}
            disabled={loading}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium disabled:opacity-50"
          >
            {loading ? 'Loading more...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
