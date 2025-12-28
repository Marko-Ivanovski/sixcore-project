'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PostList } from '@/components/users/PostList';



export default function FeedPage() {
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [feedType, setFeedType] = useState<'timeline' | 'user' | 'following'>('timeline');

  const canPost = draft.trim().length > 0 && draft.trim().length <= 280;

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
              <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                <span>{draft.length}/280</span>
                <button
                  type="button"
                  disabled={!canPost}
                  className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  Post
                </button>
              </div>
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
                key={feedType} // Force remount to clear state/offset
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
