'use client';

import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminShellProvider } from '@/components/admin/admin-shell';
import { AdminMobileHeader } from '@/components/admin/admin-mobile-header';
import { AdminMobileMain } from '@/components/admin/admin-mobile-main';
import { useAuth } from '@/lib/auth-context';
import { montserrat } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && !isAdmin) {
      router.push('/');
    }
  }, [user, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className={cn(montserrat.className, 'admin-app flex min-h-[100dvh] items-center justify-center')}>
        <div className="text-center">
          <Loader2 className="inline-block h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <AdminShellProvider>
      <div className={cn(montserrat.className, 'admin-app flex min-h-[100dvh] flex-col bg-background')}>
        <AdminMobileHeader />
        <div className="flex min-h-0 flex-1 md:flex-row">
          <AdminSidebar />
          <AdminMobileMain>{children}</AdminMobileMain>
        </div>
      </div>
    </AdminShellProvider>
  );
}
