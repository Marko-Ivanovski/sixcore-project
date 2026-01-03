'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { LogOut, Search, Settings, User } from 'lucide-react';
import { searchUsers, UserSearchResult } from '@/lib/users';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { buildAvatarUrl, setAvatarFallback } from '@/utils/avatar';

export function Navigation() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    setSearchLoading(true);

    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchUsers(trimmed, 10, controller.signal);
        if (active) {
          setSearchResults(results);
        }
      } catch (error: any) {
        if (active && error?.name !== 'AbortError') {
          setSearchResults([]);
        }
      } finally {
        if (active) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-xl font-semibold text-gray-900">
          Twitter Clone
        </Link>
        <div className="relative flex w-full max-w-sm flex-1 items-center" ref={searchRef}>
          <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search users"
            aria-label="Search users"
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
          />
          {searchOpen && hasSearch && (
            <div className="absolute top-full z-30 mt-2 w-full rounded-lg border border-gray-100 bg-white shadow-lg ring-1 ring-black/5">
              {searchLoading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                  <LoadingSpinner size="sm" />
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No users found</div>
              ) : (
                <div className="max-h-72 overflow-y-auto py-2">
                  {searchResults.map((result) => (
                    <Link
                      key={result.id}
                      href={`/user/${result.username}`}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-800 transition hover:bg-gray-50"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <img
                        src={buildAvatarUrl(result.avatarUrl, result.username)}
                        alt={result.username}
                        className="h-8 w-8 rounded-full object-cover"
                        onError={(event) => setAvatarFallback(event, result.username)}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-900">
                          {result.displayName || result.username}
                        </div>
                        <div className="truncate text-xs text-gray-500">@{result.username}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <nav className="flex shrink-0 items-center gap-4">
          {!user ? (
            <Link
              href="/login"
              className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              Log in
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full p-1 transition hover:bg-gray-100"
              >
                <img
                  src={buildAvatarUrl(user.avatarUrl, user.username)}
                  alt={user.username}
                  className="h-8 w-8 rounded-full object-cover"
                  onError={(event) => setAvatarFallback(event, user.username)}
                />
                <span className="hidden text-sm font-medium text-gray-700 sm:block">
                  {user.displayName || user.username}
                </span>
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg border border-gray-100 bg-white shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-1">
                    <Link
                      href={`/user/${user.username}`}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      <User size={16} />
                      My Profile
                    </Link>
                    <Link
                      href="/settings/profile"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings size={16} />
                      Edit Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
