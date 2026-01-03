'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PostList } from '@/components/users/PostList';
import { ApiError } from '@/lib/api';
import { createPost } from '@/lib/users';



export default function FeedPage() {
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [feedType, setFeedType] = useState<'timeline' | 'user' | 'following'>('timeline');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const canPost =
    Boolean(user) &&
    draft.trim().length > 0 &&
    draft.trim().length <= 280 &&
    !posting;

  const handlePost = async () => {
    if (!user || !canPost) return;

    setPosting(true);
    setError(null);
    try {
      await createPost({
        content: draft.trim(),
        visibility,
      });
      setDraft('');
      setVisibility('PUBLIC');
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Unable to post');
      } else {
        setError('Unable to post');
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="gradient-bg min-h-screen">
      <div className="mx-auto flex max-w-[1600px] flex-col px-4 py-4 lg:px-8">
        <main
          className="mx-auto w-full max-w-4xl space-y-4"
          itemScope
          itemType="https://schema.org/Blog"
        >
          <article
            className="card overflow-hidden"
            itemProp="mainEntity"
            itemScope
            itemType="https://schema.org/BlogPosting"
          >
            <div className="border-b border-gray-100 px-4 py-3">
              <h1 className="text-lg font-semibold text-gray-900" itemProp="headline">
                Home
              </h1>
              <p className="text-sm text-gray-500" itemProp="description">
                A clean feed experience for mobile and desktop.
              </p>
            </div>
            <div className="px-4 py-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Share something..."
                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white"
                rows={3}
                maxLength={280}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-3">
                  <span>{draft.length}/280</span>
                  <label className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-gray-500">Visibility</span>
                    <select
                      value={visibility}
                      onChange={(event) => setVisibility(event.target.value as 'PUBLIC' | 'PRIVATE')}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                      disabled={!user}
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  disabled={!canPost}
                  onClick={handlePost}
                  className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
              {!user && (
                <p className="mt-2 text-xs text-gray-500">Log in to create a post.</p>
              )}
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>
            <div className="border-t border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 flex gap-4">
              <button
                onClick={() => setFeedType('timeline')}
                className={`pb-2 border-b-2 transition-colors ${
                  feedType === 'timeline'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Posts
              </button>
              {user && (
                <>
                  <button
                    onClick={() => setFeedType('following')}
                    className={`pb-2 border-b-2 transition-colors ${
                      feedType === 'following'
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Following
                  </button>
                  <button
                    onClick={() => setFeedType('user')}
                    className={`pb-2 border-b-2 transition-colors ${
                      feedType === 'user'
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    My Posts
                  </button>
                </>
              )}
            </div>
            <div
              className="border-t border-gray-100 bg-gray-50 px-4 py-6 text-sm text-gray-600"
              itemProp="articleBody"
            >
              <PostList 
                key={`${feedType}-${refreshKey}`} // Force remount to clear state/offset
                type={feedType} 
                username={feedType === 'user' ? user?.username : undefined} 
              />
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
