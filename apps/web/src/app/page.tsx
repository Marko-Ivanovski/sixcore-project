'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PostList } from '@/components/users/PostList';
import { ApiError } from '@/lib/api';
import { createPost } from '@/lib/users';
import { uploadImage, validateImageFile } from '@/lib/uploads';

export default function FeedPage() {
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [feedType, setFeedType] = useState<'timeline' | 'following'>('timeline');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const trimmedDraft = draft.trim();
  const canPost =
    Boolean(user) &&
    trimmedDraft.length <= 280 &&
    (trimmedDraft.length > 0 || Boolean(imageFile)) &&
    !posting;

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      event.target.value = '';
      return;
    }

    clearImage();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageError(null);
  };

  const clearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
  };

  const handlePost = async () => {
    if (!user || !canPost) return;

    setPosting(true);
    setError(null);
    try {
      const imageUrl = imageFile ? await uploadImage(imageFile, 'tweets') : undefined;
      await createPost({
        content: trimmedDraft ? trimmedDraft : undefined,
        ...(imageUrl ? { imageUrl } : {}),
        visibility,
      });
      setDraft('');
      setVisibility('PUBLIC');
      setRefreshKey((prev) => prev + 1);
      clearImage();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Unable to post');
      } else if (err instanceof Error) {
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
            <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-800">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100" itemProp="headline">
                Home
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400" itemProp="description">
                A clean feed experience for mobile and desktop.
              </p>
            </div>
            <div className="px-4 py-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Share something..."
                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:bg-slate-950"
                rows={3}
                maxLength={280}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
                <label className="cursor-pointer rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                  Add image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!user || posting}
                    onChange={handleImageChange}
                  />
                </label>
                {imageFile && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                    disabled={posting}
                  >
                    Remove image
                  </button>
                )}
                {imageError && <span className="text-xs text-red-600 dark:text-red-300">{imageError}</span>}
              </div>
              {imagePreview && (
                <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Image preview"
                    className="max-h-80 w-full object-cover"
                  />
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span>{draft.length}/280</span>
                  <label className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Visibility</span>
                    <select
                      value={visibility}
                      onChange={(event) => setVisibility(event.target.value as 'PUBLIC' | 'PRIVATE')}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
                  className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
              {!user && (
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Log in to create a post.</p>
              )}
              {error && <p className="mt-2 text-xs text-red-600 dark:text-red-300">{error}</p>}
            </div>
            <div className="border-t border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 flex gap-4 dark:border-slate-800 dark:text-slate-100">
              <button
                onClick={() => setFeedType('timeline')}
                className={`pb-2 border-b-2 transition-colors ${
                  feedType === 'timeline'
                    ? 'border-gray-900 text-gray-900 dark:border-slate-100 dark:text-slate-100'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                All Posts
              </button>
              {user && (
                <button
                  onClick={() => setFeedType('following')}
                  className={`pb-2 border-b-2 transition-colors ${
                    feedType === 'following'
                      ? 'border-gray-900 text-gray-900 dark:border-slate-100 dark:text-slate-100'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Following
                </button>
              )}
            </div>
            <div
              className="border-t border-gray-100 bg-gray-50 px-4 py-6 text-sm text-gray-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300"
              itemProp="articleBody"
            >
              <PostList
                key={`${feedType}-${refreshKey}`} // Force remount to clear state/offset
                type={feedType}
              />
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
