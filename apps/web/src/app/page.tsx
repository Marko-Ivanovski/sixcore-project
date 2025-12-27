'use client';

import Link from 'next/link';
import { useState } from 'react';

type NavLink = { href: string; label: string };

const navLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/user/you', label: 'Profile' },
  { href: '/post/placeholder', label: 'Post' },
];

export default function FeedPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const canPost = draft.trim().length > 0 && draft.trim().length <= 280;

  return (
    <div className="gradient-bg min-h-screen">
      <header
        className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur"
        itemScope
        itemType="https://schema.org/WPHeader"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-50 md:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              <div className="space-y-1">
                <span className="block h-0.5 w-5 bg-gray-800" />
                <span className="block h-0.5 w-5 bg-gray-800" />
                <span className="block h-0.5 w-5 bg-gray-800" />
              </div>
            </button>
            <Link href="/" className="text-xl font-semibold text-gray-900">
              Sixcore
            </Link>
          </div>

          <nav
            className="hidden items-center gap-4 text-sm font-semibold text-gray-700 md:flex"
            itemScope
            itemType="https://schema.org/SiteNavigationElement"
          >
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-gray-900">
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="rounded-full border border-gray-200 px-3 py-1.5 text-gray-900 hover:bg-gray-50"
            >
              Log in
            </Link>
          </nav>
        </div>
        {menuOpen && (
          <div className="border-t border-gray-200 bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-3 text-sm font-semibold text-gray-800">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                Log in
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </nav>
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 lg:flex-row lg:gap-6">
        <section className="hidden w-64 shrink-0 pt-2 lg:block">
          <div className="sticky top-20 space-y-3 card p-4">
            <h2 className="text-sm font-semibold text-gray-900">Navigation</h2>
            <nav className="space-y-2 text-sm text-gray-700">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block hover:text-gray-900">
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-2 text-xs text-gray-500">
              Protected routes will require sign in.
            </div>
          </div>
        </section>

        <main
          className="w-full max-w-3xl space-y-4"
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
            <div className="border-t border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800">
              Timeline
            </div>
            <div
              className="border-t border-gray-100 bg-gray-50 px-4 py-6 text-sm text-gray-600"
              itemProp="articleBody"
            >
              Posts will appear here once connected to the API.
            </div>
          </article>
        </main>

        <aside className="hidden w-72 shrink-0 pt-2 lg:block">
          <div className="sticky top-20 space-y-3 card p-4">
            <h2 className="text-sm font-semibold text-gray-900">What&apos;s next</h2>
            <p className="text-sm text-gray-600">
              Connect this UI to the API to load posts, profiles, and comments.
            </p>
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              Mobile-first layout with a desktop shell. Hamburger nav on small screens, rail nav on large screens.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
