'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { ApiError, loginUser } from '../../lib/auth';

export default function LoginPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginUser({ identifier, password });
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
        <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-600">Sign in to continue to Sixcore.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-800">
            Email or username
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              placeholder="you@example.com"
              autoComplete="username"
              required
            />
          </label>
          <label className="block text-sm font-medium text-gray-800">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              placeholder="********"
              autoComplete="current-password"
              required
              minLength={8}
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 text-sm text-gray-600">
          No account?{' '}
          <Link href="/register" className="font-semibold text-gray-900 hover:underline">
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
        <div className="h-6 w-28 animate-pulse rounded-full bg-gray-200" />
        <div className="mt-4 space-y-3">
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
          <div className="h-10 w-full animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
