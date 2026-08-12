'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Boxes,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Truck,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { figtree } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import type { SupplierApprovalStatus } from '@/lib/types/suppliers';

const NAV = [
  { href: '/supplier/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/supplier/products', label: 'Products', icon: Package },
  { href: '/supplier/packages', label: 'Packages', icon: Boxes },
] as const;

export const SUPPLIER_STATUS_META: Record<
  SupplierApprovalStatus,
  { label: string; className: string; banner: string }
> = {
  pending: {
    label: 'Pending approval',
    className: 'bg-amber-500/15 text-amber-800 ring-amber-500/25',
    banner:
      'Your account is awaiting admin approval. You can list products and packages now — they go live on the storefront once approved.',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
    banner: 'Your account is approved. Listed products and packages appear on the public storefront when active.',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-500/15 text-rose-800 ring-rose-500/25',
    banner:
      'Your application was not approved. Contact SheQueen support if you believe this is a mistake.',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-slate-500/15 text-slate-800 ring-slate-500/25',
    banner:
      'Your supplier account is suspended. Public listings are hidden until an admin reactivates you.',
  },
};

type SupplierShellProps = {
  children: React.ReactNode;
  /** Public marketing/auth pages — no auth gate. */
  publicPage?: boolean;
};

export function SupplierShell({ children, publicPage = false }: SupplierShellProps) {
  const { user, profile, isSupplier, supplierId, loading, logout } = useAuth();
  const { getSupplierById, loading: suppliersLoading } = useSuppliers();
  const router = useRouter();
  const pathname = usePathname();

  const supplier = supplierId ? getSupplierById(supplierId) : undefined;
  const status = supplier?.approvalStatus ?? 'pending';
  const statusMeta = SUPPLIER_STATUS_META[status];

  useEffect(() => {
    if (publicPage || loading) return;
    if (!user) {
      router.replace(`/supplier/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isSupplier) {
      router.replace('/supplier');
    }
  }, [publicPage, loading, user, isSupplier, router, pathname]);

  if (publicPage) {
    return <div className={cn(figtree.className, 'min-h-[100dvh] bg-background')}>{children}</div>;
  }

  if (loading || suppliersLoading || !user || !isSupplier) {
    return (
      <div
        className={cn(
          figtree.className,
          'flex min-h-[100dvh] items-center justify-center bg-background'
        )}
      >
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading supplier portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(figtree.className, 'min-h-[100dvh] bg-[#F7F5F2] text-foreground')}>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo variant="icon" href="/supplier/dashboard" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                {supplier?.companyName || supplier?.name || 'Supplier portal'}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {profile?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'hidden rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset sm:inline-flex',
                statusMeta.className
              )}
            >
              {statusMeta.label}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={async () => {
                await logout();
                router.push('/supplier');
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
        <nav className="border-t border-border/60 bg-background">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {(status === 'pending' || status === 'rejected' || status === 'suspended') && (
        <div
          className={cn(
            'border-b px-4 py-3 text-sm sm:px-6',
            status === 'pending' && 'border-amber-200/80 bg-amber-50 text-amber-950',
            status === 'rejected' && 'border-rose-200/80 bg-rose-50 text-rose-950',
            status === 'suspended' && 'border-slate-200/80 bg-slate-100 text-slate-900'
          )}
        >
          <div className="mx-auto flex max-w-6xl gap-2">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
            <p>{statusMeta.banner}</p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
