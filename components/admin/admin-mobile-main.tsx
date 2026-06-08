'use client';

import { useAdminShell } from '@/components/admin/admin-shell';
import { cn } from '@/lib/utils';

export function AdminMobileMain({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { sidebarOpen, setSidebarOpen } = useAdminShell();

  return (
    <main
      className={cn('flex-1 overflow-x-hidden overflow-y-auto', className)}
      onClick={() => {
        if (sidebarOpen) setSidebarOpen(false);
      }}
    >
      {children}
    </main>
  );
}
