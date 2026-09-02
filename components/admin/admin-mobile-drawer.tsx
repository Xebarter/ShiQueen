'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ExternalLink, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAdminShell } from '@/components/admin/admin-shell';
import { ADMIN_NAV_ITEMS, isAdminNavActive } from '@/components/admin/admin-nav-items';
import { InstallAppButton } from '@/components/pwa/install-app-button';
import { getEmailInitial, getAvatarColorsForLetter } from '@/lib/user-display';
import { cn } from '@/lib/utils';
import { useState } from 'react';

/** Matches AdminMobileHeader height (h-16 = 4rem) */
const MOBILE_HEADER_OFFSET = '4rem';

export function AdminMobileDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useAdminShell();
  const [loggingOut, setLoggingOut] = useState(false);

  const close = () => setSidebarOpen(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setSidebarOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const emailInitial = user?.email ? getEmailInitial(user.email) : '?';
  const avatarColors = getAvatarColorsForLetter(emailInitial);

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-[45] cursor-default bg-black/60 backdrop-blur-[2px] md:hidden"
          onClick={close}
        />
      )}

      <aside
        id="admin-mobile-nav"
        style={{ top: MOBILE_HEADER_OFFSET, height: `calc(100dvh - ${MOBILE_HEADER_OFFSET})` }}
        className={cn(
          'fixed left-0 z-50 flex w-[min(20rem,82vw)] flex-col overflow-hidden',
          'border-r border-border/80 bg-card shadow-2xl transition-transform duration-300 ease-out md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
        onClick={(e) => e.stopPropagation()}
        aria-hidden={!sidebarOpen}
      >
        {/* Nav fills all remaining space — 8 equal rows, no scroll */}
        <nav
          className="min-h-0 flex-1 px-2 py-2"
          aria-label="Admin navigation"
          style={{ flex: '1 1 0%' }}
        >
          <ul
            className="grid h-full gap-px"
            style={{ gridTemplateRows: `repeat(${ADMIN_NAV_ITEMS.length}, minmax(0, 1fr))` }}
          >
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isAdminNavActive(pathname, item.href);
              return (
                <li key={item.href} className="min-h-0">
                  <Link
                    href={item.href}
                    onClick={close}
                    className={cn(
                      'flex h-full items-center gap-2 rounded-md px-2 text-[13px] font-medium leading-none sm:text-sm',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-secondary/80'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md sm:h-8 sm:w-8',
                        active ? 'bg-primary-foreground/15' : 'bg-muted'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Compact footer — fixed height, never grows */}
        <div className="shrink-0 border-t border-border/60 bg-muted/15 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {user?.email && (
            <div className="mb-1.5 flex items-center gap-2 px-1">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: avatarColors.background }}
              >
                {emailInitial}
              </span>
              <p className="min-w-0 truncate text-[11px] text-muted-foreground" title={user.email}>
                {user.email}
              </p>
            </div>
          )}

          <InstallAppButton variant="drawer" />

          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href="/"
              onClick={close}
              className="flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-card text-[11px] font-semibold transition hover:bg-secondary sm:h-9 sm:text-xs"
            >
              <ExternalLink className="h-3 w-3" />
              Store
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-card text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 sm:h-9 sm:text-xs dark:hover:bg-red-950/20"
            >
              <LogOut className="h-3 w-3" />
              {loggingOut ? '…' : 'Sign out'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
