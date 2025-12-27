'use client';

import Link from 'next/link';

type PageProps = {
  params: { postId: string };
};

export default function PostDetailPage({ params }: PageProps) {
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
              ← Back
            </button>
          </div>
          <div className="px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-sky-100 to-purple-100 text-sm font-semibold text-gray-700 ring-1 ring-gray-200">
                ?
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Post #{params.postId}
                </div>
                <div className="text-xs text-gray-500">Content will load from API</div>
              </div>
            </div>
            <p className="mt-4 text-base leading-relaxed text-gray-900">
              Once the API is connected, this will render the post content, image (if any),
              and author details.
            </p>
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
            Comments
          </div>
          <div className="px-4 py-5 text-sm text-gray-600">
            Comments will appear here when connected to the API.
          </div>
        </div>

        <div className="card p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">Next steps</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Fetch post by ID and show counts.</li>
            <li>Render comments with pagination and add comment form.</li>
            <li>Wire like/retweet actions to API.</li>
          </ul>
          <Link href="/" className="mt-3 inline-block text-gray-900 hover:underline">
            Back to feed
          </Link>
        </div>
      </div>
    </div>
  );
}
