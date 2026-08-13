'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';

type AuthGuestOnlyProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

export function AuthGuestOnly({ children, redirectTo }: AuthGuestOnlyProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const dest = redirectTo ?? getPostAuthPath(profile);

  useEffect(() => {
    if (!loading && user) {
      router.replace(dest);
    }
  }, [user, loading, router, dest]);

  if (loading || user) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
