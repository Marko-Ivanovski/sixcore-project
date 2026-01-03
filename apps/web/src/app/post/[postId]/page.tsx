'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Lock, MessageCircle, Repeat2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import {
  addComment,
  CommentItem,
  deletePost,
  getPostById,
  getPostComments,
  likePost,
  retweetPost,
  updatePost,
  unlikePost,
  unretweetPost,
} from '@/lib/posts';
import type { PostItem } from '@/lib/users';

type PageProps = {
  params: { postId: string };
};

export default function PostDetailPage({ params }: PageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<PostItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [pending, setPending] = useState<{ like?: boolean; retweet?: boolean }>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyErrors, setReplyErrors] = useState<Record<string, string | null>>({});
  const [replying, setReplying] = useState<Record<string, boolean>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editVisibility, setEditVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

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

  useEffect(() => {
    if (!post) return;
    setEditContent(post.content ?? '');
    setEditVisibility(post.visibility);
  }, [post]);

  const targetPostId = post?.originalPostId ?? post?.id ?? params.postId;
  const isOwner =
    Boolean(user && post && post.kind === 'ORIGINAL' && user.username === post.author.username);

  const loadMoreComments = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const response = await getPostComments(targetPostId, 20, offset);
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
      const newComment = await addComment(targetPostId, commentDraft.trim());
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

  const handleLikeToggle = async () => {
    if (!post) return;
    if (!user) {
      setActionError('Log in to like posts.');
      return;
    }
    if (pending.like) return;

    setActionError(null);
    const actionPostId = post.originalPostId ?? post.id;
    const nextLiked = !post.likedByMe;
    const previous = { likedByMe: post.likedByMe, likeCount: post.likeCount };

    setPost({
      ...post,
      likedByMe: nextLiked,
      likeCount: Math.max(0, post.likeCount + (nextLiked ? 1 : -1)),
    });
    setPending((prev) => ({ ...prev, like: true }));

    try {
      const result = nextLiked
        ? await likePost(actionPostId)
        : await unlikePost(actionPostId);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              likedByMe: result.likedByMe,
              likeCount: result.likeCount,
            }
          : prev,
      );
    } catch (err) {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              likedByMe: previous.likedByMe,
              likeCount: previous.likeCount,
            }
          : prev,
      );
      setActionError('Unable to update like.');
    } finally {
      setPending((prev) => ({ ...prev, like: false }));
    }
  };

  const handleRetweetToggle = async () => {
    if (!post) return;
    if (!user) {
      setActionError('Log in to retweet posts.');
      return;
    }
    if (pending.retweet) return;

    setActionError(null);
    const actionPostId = post.originalPostId ?? post.id;
    const nextRetweet = !post.retweetedByMe;
    const previous = {
      retweetedByMe: post.retweetedByMe,
      retweetCount: post.retweetCount,
    };

    setPost({
      ...post,
      retweetedByMe: nextRetweet,
      retweetCount: Math.max(0, post.retweetCount + (nextRetweet ? 1 : -1)),
    });
    setPending((prev) => ({ ...prev, retweet: true }));

    try {
      const result = nextRetweet
        ? await retweetPost(actionPostId)
        : await unretweetPost(actionPostId);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              retweetedByMe: result.retweetedByMe,
              retweetCount: result.retweetCount,
            }
          : prev,
      );
    } catch (err) {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              retweetedByMe: previous.retweetedByMe,
              retweetCount: previous.retweetCount,
            }
          : prev,
      );
      setActionError('Unable to update retweet.');
    } finally {
      setPending((prev) => ({ ...prev, retweet: false }));
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!user) {
      setActionError('Log in to reply.');
      return;
    }

    const draft = (replyDrafts[commentId] ?? '').trim();
    if (!draft) return;

    setReplyErrors((prev) => ({ ...prev, [commentId]: null }));
    setReplying((prev) => ({ ...prev, [commentId]: true }));

    try {
      const newReply = await addComment(targetPostId, draft, commentId);
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id !== commentId) {
            return comment;
          }

          const existingReplies = comment.replies ?? [];
          return {
            ...comment,
            replies: [...existingReplies, newReply],
          };
        }),
      );

      setPost((prev) =>
        prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev,
      );
      setReplyDrafts((prev) => ({ ...prev, [commentId]: '' }));
      setActiveReplyId(null);
    } catch (err) {
      setReplyErrors((prev) => ({
        ...prev,
        [commentId]: 'Unable to add reply.',
      }));
    } finally {
      setReplying((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!post) return;

    const trimmed = editContent.trim();
    if (!trimmed && !post.imageUrl) {
      setEditError('Content or image is required.');
      return;
    }

    setEditError(null);
    setEditPending(true);
    try {
      const updated = await updatePost(post.id, {
        content: trimmed,
        visibility: editVisibility,
      });
      setPost(updated);
      setEditing(false);
    } catch (err) {
      setEditError('Unable to update post.');
    } finally {
      setEditPending(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;

    setDeletePending(true);
    try {
      await deletePost(post.id);
      router.push('/');
    } catch (err) {
      setActionError('Unable to delete post.');
    } finally {
      setDeletePending(false);
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
          <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <button
              type="button"
              className="text-sm font-semibold text-gray-500 hover:text-gray-900"
              onClick={() => history.back()}
            >
              Back
            </button>
            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing((prev) => !prev)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={deletePending}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletePending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
          <div className="px-4 py-5">
            {post.kind === 'RETWEET' && post.repostedBy && (
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <Repeat2 size={14} />
                <Link href={`/user/${post.repostedBy.username}`} className="hover:underline">
                  {post.repostedBy.displayName || post.repostedBy.username}
                </Link>
                <span>reposted</span>
              </div>
            )}
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

            {editing ? (
              <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
                <textarea
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none"
                  rows={4}
                  maxLength={280}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    Visibility
                    <select
                      value={editVisibility}
                      onChange={(event) =>
                        setEditVisibility(event.target.value as 'PUBLIC' | 'PRIVATE')
                      }
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={editPending}
                    className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                  >
                    {editPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {editError && <p className="text-xs text-red-600">{editError}</p>}
              </form>
            ) : (
              <>
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
              </>
            )}

            <div className="mt-6 flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <MessageCircle size={16} />
                <span>{post.commentCount}</span>
              </div>
              <button
                type="button"
                className={`flex items-center space-x-1 transition-colors ${
                  post.retweetedByMe ? 'text-green-600' : 'hover:text-green-500'
                } ${pending.retweet ? 'opacity-60' : ''}`}
                aria-label="Retweets"
                aria-pressed={post.retweetedByMe}
                onClick={handleRetweetToggle}
                disabled={pending.retweet}
              >
                <Repeat2 size={16} />
                <span>{post.retweetCount}</span>
              </button>
              <button
                type="button"
                className={`flex items-center space-x-1 transition-colors ${
                  post.likedByMe ? 'text-red-500' : 'hover:text-red-500'
                } ${pending.like ? 'opacity-60' : ''}`}
                aria-label="Likes"
                aria-pressed={post.likedByMe}
                onClick={handleLikeToggle}
                disabled={pending.like}
              >
                <Heart size={16} />
                <span>{post.likeCount}</span>
              </button>
            </div>
            {actionError && (
              <p className="mt-3 text-xs text-red-600">{actionError}</p>
            )}
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
                {comments.map((comment) => {
                  const replies = comment.replies ?? [];
                  const replyDraft = replyDrafts[comment.id] ?? '';
                  const replyError = replyErrors[comment.id];
                  const isReplying = replying[comment.id];
                  const isReplyOpen = activeReplyId === comment.id;

                  return (
                    <div key={comment.id} className="rounded-lg border border-gray-100 bg-white p-3">
                      <div className="text-xs text-gray-500">
                        {comment.author.displayName || comment.author.username} @
                        {comment.author.username}
                      </div>
                      <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        {user && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReplyId(isReplyOpen ? null : comment.id)
                            }
                            className="font-semibold text-gray-700 hover:underline"
                          >
                            Reply
                          </button>
                        )}
                        {replies.length > 0 && (
                          <span>
                            {replies.length} repl{replies.length === 1 ? 'y' : 'ies'}
                          </span>
                        )}
                      </div>

                      {user && isReplyOpen && (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            handleReplySubmit(comment.id);
                          }}
                          className="mt-3 space-y-2"
                        >
                          <textarea
                            value={replyDraft}
                            onChange={(event) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [comment.id]: event.target.value,
                              }))
                            }
                            placeholder="Write a reply..."
                            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none"
                            rows={2}
                            maxLength={280}
                          />
                          {replyError && <p className="text-xs text-red-600">{replyError}</p>}
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={isReplying}
                              className="rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                            >
                              {isReplying ? 'Replying...' : 'Reply'}
                            </button>
                          </div>
                        </form>
                      )}

                      {replies.length > 0 && (
                        <div className="mt-3 space-y-3 border-l border-gray-100 pl-4">
                          {replies.map((reply) => (
                            <div key={reply.id} className="rounded-lg bg-gray-50 p-2">
                              <div className="text-xs text-gray-500">
                                {reply.author.displayName || reply.author.username} @
                                {reply.author.username}
                              </div>
                              <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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
