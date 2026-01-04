'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirectTarget = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${redirectTarget}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
