'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { getAdminPageTitle, useAdminShell } from '@/components/admin/admin-shell';
import { cn } from '@/lib/utils';

export function AdminMobileHeader() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAdminShell();
  const pathname = usePathname();
  const title = getAdminPageTitle(pathname);

  const closeMenu = () => setSidebarOpen(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-[60] flex h-16 shrink-0 items-center gap-3 border-b border-border',
        'bg-card/95 px-4 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/90 md:hidden'
      )}
      onClick={() => {
        if (sidebarOpen) closeMenu();
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleSidebar();
        }}
        aria-expanded={sidebarOpen}
        aria-controls="admin-mobile-nav"
        aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition',
          sidebarOpen
            ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
            : 'border-border bg-background hover:bg-secondary'
        )}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          SheQueen Admin
        </p>
        <p className="truncate text-base font-semibold leading-tight tracking-tight">
          {title}
        </p>
      </div>

      <Link
        href="/"
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/5"
      >
        Store
      </Link>
    </header>
  );
}
