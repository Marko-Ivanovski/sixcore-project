'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Lock, MessageCircle, Repeat2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { addComment, CommentItem, getPostById, getPostComments } from '@/lib/posts';
import type { PostItem } from '@/lib/users';

type PageProps = {
  params: { postId: string };
};

export default function PostDetailPage({ params }: PageProps) {
  const { user } = useAuth();
  const [post, setPost] = useState<PostItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [postResponse, commentsResponse] = await Promise.all([
          getPostById(params.postId),
          getPostComments(params.postId, 20, 0),
        ]);

        if (!active) return;

        setPost(postResponse);
        setComments(commentsResponse.items);
        setHasMore(commentsResponse.hasMore);
        setOffset(commentsResponse.items.length);
      } catch (err) {
        if (!active) return;

        if (err instanceof ApiError) {
          setError(err.status === 403 ? 'This post is private.' : err.message);
        } else {
          setError('Unable to load post');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [params.postId]);

  const loadMoreComments = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const response = await getPostComments(params.postId, 20, offset);
      setComments((prev) => [...prev, ...response.items]);
      setHasMore(response.hasMore);
      setOffset((prev) => prev + response.items.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAddComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentDraft.trim()) return;

    setCommentError(null);
    try {
      const newComment = await addComment(params.postId, commentDraft.trim());
      setComments((prev) => [newComment, ...prev]);
      setPost((prev) =>
        prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev,
      );
      setCommentDraft('');
    } catch (err) {
      if (err instanceof ApiError) {
        setCommentError(err.message || 'Unable to add comment');
      } else {
        setCommentError('Unable to add comment');
      }
    }
  };

  if (loading) {
    return (
      <div className="gradient-bg min-h-screen px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="card p-6 text-center text-gray-500">Loading post...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="gradient-bg min-h-screen px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="card p-6 text-center text-gray-600">{error || 'Post not found'}</div>
          <Link href="/" className="text-sm font-semibold text-gray-900 hover:underline">
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg min-h-screen px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3">
            <button
              type="button"
              className="text-sm font-semibold text-gray-500 hover:text-gray-900"
              onClick={() => history.back()}
            >
              Back
            </button>
          </div>
          <div className="px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-sky-100 to-purple-100 text-sm font-semibold text-gray-700 ring-1 ring-gray-200">
                {post.author.displayName?.slice(0, 1) || post.author.username.slice(0, 1)}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {post.author.displayName || post.author.username}
                </div>
                <div className="text-xs text-gray-500">@{post.author.username}</div>
              </div>
              {post.visibility === 'PRIVATE' && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                  <Lock size={12} />
                  Private
                </span>
              )}
            </div>

            {post.content && (
              <p className="mt-4 text-base leading-relaxed text-gray-900 whitespace-pre-wrap">
                {post.content}
              </p>
            )}

            {post.imageUrl && (
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt="Post content"
                  className="rounded-lg max-h-96 w-full object-cover bg-gray-100"
                />
              </div>
            )}

            <div className="mt-6 flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <MessageCircle size={16} />
                <span>{post.commentCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Repeat2 size={16} />
                <span>{post.retweetCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart size={16} />
                <span>{post.likeCount}</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
            Comments
          </div>
          <div className="px-4 py-5 text-sm text-gray-600 space-y-4">
            {user ? (
              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Write a comment..."
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none"
                  rows={3}
                  maxLength={280}
                />
                {commentError && <p className="text-xs text-red-600">{commentError}</p>}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Add comment
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-gray-500">Log in to add a comment.</p>
            )}

            {comments.length === 0 ? (
              <p className="text-sm text-gray-500">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-gray-100 bg-white p-3">
                    <div className="text-xs text-gray-500">
                      {comment.author.displayName || comment.author.username} @
                      {comment.author.username}
                    </div>
                    <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {hasMore && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={loadMoreComments}
                  disabled={loadingMore}
                  className="text-sm font-semibold text-gray-900 hover:underline disabled:opacity-50"
                >
                  {loadingMore ? 'Loading more...' : 'Load more comments'}
                </button>
              </div>
            )}
          </div>
        </div>

        <Link href="/" className="text-sm font-semibold text-gray-900 hover:underline">
          Back to feed
        </Link>
      </div>
    </div>
  );
}
