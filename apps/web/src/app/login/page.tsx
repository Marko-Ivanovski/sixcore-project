'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ApiError, loginUser } from '../../lib/auth';

import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginUser({ identifier, password });
      await refreshUser();
      router.replace(redirect);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Unable to log in');
      } else {
        setError('Unable to log in');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = identifier.trim().length > 0 && password.length >= 8 && !submitting;

  return (
    <div className="gradient-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">Sign in to continue to Twitter Clone.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
            Email or username
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-gray-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:bg-slate-950"
              placeholder="you@example.com"
              autoComplete="username"
              required
            />
          </label>
          <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
            Password
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm outline-none transition focus:border-gray-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:bg-slate-950"
                placeholder="********"
                autoComplete="current-password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 text-sm text-gray-600 dark:text-slate-300">
          No account?{' '}
          <Link href="/register" className="font-semibold text-gray-900 hover:underline dark:text-slate-100">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md p-6">
        <div className="h-6 w-28 animate-pulse rounded-full bg-gray-200 dark:bg-slate-700" />
        <div className="mt-4 space-y-3">
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700" />
          <div className="h-10 w-full animate-pulse rounded-full bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
