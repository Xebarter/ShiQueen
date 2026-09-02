'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { BrandLogo } from '@/components/brand-logo';
import { ADMIN_NAV_ITEMS, isAdminNavActive } from '@/components/admin/admin-nav-items';
import { AdminMobileDrawer } from '@/components/admin/admin-mobile-drawer';
import { InstallAppButton } from '@/components/pwa/install-app-button';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <AdminMobileDrawer />

      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border p-6">
          <BrandLogo variant="admin" href="/admin" />
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto p-4">
          <div className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isAdminNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-auto space-y-3 border-t border-border pt-4">
            {user?.email && (
              <p className="truncate px-4 text-xs text-muted-foreground" title={user.email}>
                {user.email}
              </p>
            )}
            <InstallAppButton variant="sidebar" />
            <Button
              variant="outline"
              className="min-h-11 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {loggingOut ? 'Signing out…' : 'Logout'}
            </Button>
          </div>
        </nav>
      </aside>
    </>
  );
}
