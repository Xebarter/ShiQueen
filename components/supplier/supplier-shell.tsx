'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Loader2,
  Package,
  Settings,
  Star,
  Truck,
  UserRound,
  Warehouse,
} from 'lucide-react';
import { PartnerDashboardChrome } from '@/components/partner/partner-dashboard-shell';
import type { PartnerNavItem, PartnerPageTitle, PartnerTabItem } from '@/components/partner/partner-nav';
import { useAuth } from '@/lib/auth-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { montserrat } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import type { SupplierApprovalStatus } from '@/lib/types/suppliers';
import { SUPPLIER_HOME_HREF, SUPPLIER_INSIGHTS_HREF } from '@/lib/pwa/paths';

export const SUPPLIER_NAV: readonly PartnerNavItem[] = [
  { href: SUPPLIER_HOME_HREF, label: 'Orders', icon: ClipboardList, group: 'Work' },
  { href: '/suppliers/reviews', label: 'Reviews', icon: Star, group: 'Work' },
  { href: '/suppliers/products', label: 'Products', icon: Package, group: 'Catalog' },
  { href: '/suppliers/packages', label: 'Packages', icon: Boxes, group: 'Catalog' },
  { href: '/suppliers/inventory', label: 'Inventory', icon: Warehouse, group: 'Catalog' },
  { href: SUPPLIER_INSIGHTS_HREF, label: 'Insights', icon: BarChart3, group: 'Account' },
  { href: '/suppliers/profile', label: 'Profile', icon: UserRound, group: 'Account' },
  { href: '/suppliers/settings', label: 'Settings', icon: Settings, group: 'Account' },
];

export const SUPPLIER_TABS: readonly PartnerTabItem[] = [
  { href: SUPPLIER_HOME_HREF, label: 'Orders', icon: ClipboardList },
  { href: '/suppliers/products', label: 'Products', icon: Package },
  { href: '/suppliers/packages', label: 'Packages', icon: Boxes },
  { href: '/suppliers/profile', label: 'Profile', icon: UserRound },
];

export const SUPPLIER_PAGE_TITLES: readonly PartnerPageTitle[] = [
  { match: '/suppliers/products', title: 'Products' },
  { match: '/suppliers/packages', title: 'Packages' },
  { match: '/suppliers/orders', title: 'Orders' },
  { match: '/suppliers/inventory', title: 'Inventory' },
  { match: '/suppliers/reviews', title: 'Reviews' },
  { match: '/suppliers/profile', title: 'Profile' },
  { match: '/suppliers/settings', title: 'Settings' },
  { match: SUPPLIER_INSIGHTS_HREF, title: 'Insights', exact: true },
];

export const SUPPLIER_STATUS_META: Record<
  SupplierApprovalStatus,
  { label: string; className: string; banner: string }
> = {
  pending: {
    label: 'Pending approval',
    className: 'bg-amber-500/15 text-amber-800 ring-amber-500/25',
    banner:
      'Your account is awaiting admin approval. You can complete your profile now — listing products and packages unlocks once you are approved.',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
    banner:
      'Your account is approved. Listed products and packages appear on the public storefront when active.',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-500/15 text-rose-800 ring-rose-500/25',
    banner:
      'Your application was not approved. Contact ShiQueen support if you believe this is a mistake.',
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
  const showBanner = status === 'pending' || status === 'rejected' || status === 'suspended';

  useEffect(() => {
    if (publicPage || loading) return;
    if (!user) {
      router.replace(`/suppliers/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isSupplier) {
      router.replace('/suppliers');
    }
  }, [publicPage, loading, user, isSupplier, router, pathname]);

  if (publicPage) {
    return <div className={cn(montserrat.className, 'min-h-[100dvh] bg-background')}>{children}</div>;
  }

  if (loading || suppliersLoading || !user || !isSupplier) {
    return (
      <div
        className={cn(
          montserrat.className,
          'partner-app partner-premium-app flex min-h-[100dvh] items-center justify-center'
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
    <PartnerDashboardChrome
      portalLabel="Supplier"
      homeHref={SUPPLIER_HOME_HREF}
      marketplaceHref="/shop"
      marketplaceLabel="Storefront"
      businessName={supplier?.companyName || supplier?.name || 'Supplier portal'}
      email={profile?.email}
      avatarUrl={supplier?.logo}
      statusLabel={statusMeta.label}
      statusClassName={statusMeta.className}
      statusBanner={
        showBanner
          ? `${statusMeta.banner}${
              status === 'rejected' && supplier?.rejectionReason
                ? ` Reason: ${supplier.rejectionReason}`
                : ''
            }`
          : null
      }
      statusTone={showBanner ? status : null}
      statusIcon={Truck}
      nav={SUPPLIER_NAV}
      tabs={SUPPLIER_TABS}
      pageTitles={SUPPLIER_PAGE_TITLES}
      chromeVariant="premium"
      onLogout={async () => {
        await logout();
        router.push('/');
      }}
    >
      {children}
    </PartnerDashboardChrome>
  );
}
