'use client';

import Link from 'next/link';

type PageProps = {
  params: { username: string };
};

export default function ProfilePage({ params }: PageProps) {
  return (
    <div className="gradient-bg min-h-screen px-4 py-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 lg:flex-row lg:gap-6">
        <main className="w-full max-w-3xl card overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
            <button
              type="button"
              className="mb-3 text-sm font-semibold text-gray-500 hover:text-gray-900"
              onClick={() => history.back()}
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-sky-100 to-purple-100 text-base font-semibold text-gray-700 ring-1 ring-gray-200">
                {params.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  @{params.username}
                </div>
                <div className="text-sm text-gray-500">Profile will load from API</div>
              </div>
              <div className="ml-auto">
                <button className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                  Follow
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-700">
              Bio, location, and join date will appear once connected to data.
            </p>
            <div className="mt-3 flex gap-4 text-sm text-gray-700">
              <span>
                <strong className="text-gray-900">0</strong> Following
              </span>
              <span>
                <strong className="text-gray-900">0</strong> Followers
              </span>
              <span>
                <strong className="text-gray-900">0</strong> Posts
              </span>
            </div>
          </div>

          <div className="px-4 py-5 text-sm text-gray-600">
            Posts for @{params.username} will appear here.
          </div>
        </main>

        <aside className="hidden w-64 shrink-0 pt-2 lg:block">
          <div className="sticky top-20 card p-4">
            <h2 className="text-sm font-semibold text-gray-900">Explore</h2>
            <p className="mt-2 text-sm text-gray-600">
              Connect to the API to show suggested follows and user stats.
            </p>
            <nav className="mt-3 space-y-2 text-sm text-gray-700">
              <Link href="/" className="block hover:text-gray-900">
                Home
              </Link>
              <Link href="/login" className="block hover:text-gray-900">
                Login
              </Link>
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
