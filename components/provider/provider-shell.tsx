'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  Loader2,
  Scissors,
  Settings,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react';
import { PartnerDashboardChrome } from '@/components/partner/partner-dashboard-shell';
import type { PartnerNavItem, PartnerPageTitle, PartnerTabItem } from '@/components/partner/partner-nav';
import { useAuth } from '@/lib/auth-context';
import { shouldRedirectHomeAfterLogout } from '@/lib/auth-redirect';
import { useServices } from '@/lib/services-context';
import { montserrat } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import type { ProviderApprovalStatus } from '@/lib/types/services';
import { PROVIDER_HOME_HREF, PROVIDER_INSIGHTS_HREF } from '@/lib/pwa/paths';

export const PROVIDER_NAV: readonly PartnerNavItem[] = [
  { href: PROVIDER_HOME_HREF, label: 'Bookings', icon: ClipboardList, group: 'Studio' },
  { href: '/services/dashboard/listings', label: 'Listings', icon: Scissors, group: 'Studio' },
  { href: '/services/dashboard/availability', label: 'Hours', icon: CalendarClock, group: 'Studio' },
  { href: '/services/dashboard/reviews', label: 'Reviews', icon: Star, group: 'Studio' },
  { href: PROVIDER_INSIGHTS_HREF, label: 'Insights', icon: BarChart3, group: 'Account' },
  { href: '/services/dashboard/profile', label: 'Profile', icon: UserRound, group: 'Account' },
  { href: '/services/dashboard/settings', label: 'Settings', icon: Settings, group: 'Account' },
];

export const PROVIDER_TABS: readonly PartnerTabItem[] = [
  { href: PROVIDER_HOME_HREF, label: 'Bookings', icon: ClipboardList },
  { href: '/services/dashboard/listings', label: 'Listings', icon: Scissors },
  { href: '/services/dashboard/profile', label: 'Profile', icon: UserRound },
  { href: '/services/dashboard/settings', label: 'Settings', icon: Settings },
];

export const PROVIDER_PAGE_TITLES: readonly PartnerPageTitle[] = [
  { match: '/services/dashboard/listings', title: 'Listings' },
  { match: '/services/dashboard/bookings', title: 'Bookings' },
  { match: '/services/dashboard/availability', title: 'Hours' },
  { match: '/services/dashboard/reviews', title: 'Reviews' },
  { match: '/services/dashboard/profile', title: 'Profile' },
  { match: '/services/dashboard/settings', title: 'Settings' },
  { match: PROVIDER_INSIGHTS_HREF, title: 'Insights', exact: true },
];

export const PROVIDER_STATUS_META: Record<
  ProviderApprovalStatus,
  { label: string; className: string; banner: string }
> = {
  pending: {
    label: 'Pending approval',
    className: 'bg-amber-500/15 text-amber-800 ring-amber-500/25',
    banner:
      'Your provider account is awaiting admin approval. You can finish your profile now — listing services unlocks once you are approved.',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
    banner: 'Your account is approved. Active listings appear on the public services marketplace.',
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
      'Your provider account is suspended. Public listings are hidden until an admin reactivates you.',
  },
};

type ProviderShellProps = {
  children: React.ReactNode;
};

export function ProviderShell({ children }: ProviderShellProps) {
  const { user, profile, isServiceProvider, providerId, loading, logout } = useAuth();
  const { providers, loading: servicesLoading } = useServices();
  const router = useRouter();
  const pathname = usePathname();

  const provider = providers.find((p) => p.id === providerId);
  const status = provider?.approvalStatus ?? 'pending';
  const statusMeta = PROVIDER_STATUS_META[status];
  const showBanner = status === 'pending' || status === 'rejected' || status === 'suspended';

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (shouldRedirectHomeAfterLogout()) {
        router.replace('/');
        return;
      }
      router.replace(`/services/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isServiceProvider) {
      router.replace('/services');
    }
  }, [loading, user, isServiceProvider, router, pathname]);

  if (loading || servicesLoading || !user || !isServiceProvider) {
    return (
      <div
        className={cn(
          montserrat.className,
          'partner-app flex min-h-[100dvh] items-center justify-center bg-background'
        )}
      >
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading services dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <PartnerDashboardChrome
      portalLabel="Services"
      homeHref={PROVIDER_HOME_HREF}
      marketplaceHref="/services"
      marketplaceLabel="Marketplace"
      businessName={provider?.businessName || provider?.name || 'Services dashboard'}
      email={profile?.email}
      avatarUrl={provider?.profileImage}
      statusLabel={statusMeta.label}
      statusClassName={statusMeta.className}
      statusBanner={
        showBanner
          ? `${statusMeta.banner}${
              status === 'rejected' && provider?.rejectionReason
                ? ` Reason: ${provider.rejectionReason}`
                : ''
            }`
          : null
      }
      statusTone={showBanner ? status : null}
      statusIcon={Sparkles}
      nav={PROVIDER_NAV}
      tabs={PROVIDER_TABS}
      pageTitles={PROVIDER_PAGE_TITLES}
      onLogout={async () => {
        await logout();
        router.replace('/');
      }}
    >
      {children}
    </PartnerDashboardChrome>
  );
}
