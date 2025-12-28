'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings } from 'lucide-react';

export function Navigation() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-semibold text-gray-900">
          Sixcore
        </Link>
        <nav className="flex items-center gap-4">
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
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                    <User size={16} />
                  </div>
                )}
                <span className="hidden text-sm font-medium text-gray-700 sm:block">
                  {user.displayName || user.username}
                </span>
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg border border-gray-100 bg-white shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-1">
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
