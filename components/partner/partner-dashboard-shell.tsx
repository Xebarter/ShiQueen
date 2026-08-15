'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ExternalLink, LogOut, Menu, X, type LucideIcon } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { EmailVerificationBanner } from '@/components/partner/email-verification-banner';
import { PartnerPwaRuntime } from '@/components/pwa/partner-pwa-runtime';
import {
  getPartnerPageTitle,
  isPartnerNavActive,
  type PartnerNavItem,
  type PartnerPageTitle,
  type PartnerTabItem,
} from '@/components/partner/partner-nav';
import { isRemoteProductImage } from '@/components/product-image';
import { getAvatarColorsForLetter, getEmailInitial } from '@/lib/user-display';
import { figtree } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { readPartnerTabSlideIn, usePartnerTabSwipe } from '@/components/partner/partner-tab-swipe';
import { InstallAppButton } from '@/components/pwa/install-app-button';

type PartnerShellContextValue = {
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  toggleNav: () => void;
};

const PartnerShellContext = createContext<PartnerShellContextValue | null>(null);

function PartnerShellProvider({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  const toggleNav = useCallback(() => {
    setNavOpen((open) => !open);
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  const value = useMemo(
    () => ({ navOpen, setNavOpen, toggleNav }),
    [navOpen, toggleNav]
  );

  return (
    <PartnerShellContext.Provider value={value}>{children}</PartnerShellContext.Provider>
  );
}

function usePartnerShell() {
  const context = useContext(PartnerShellContext);
  if (!context) {
    throw new Error('usePartnerShell must be used within PartnerDashboardChrome');
  }
  return context;
}

export type PartnerStatusTone = 'pending' | 'rejected' | 'suspended' | null;

export type PartnerDashboardChromeProps = {
  children: React.ReactNode;
  portalLabel: string;
  homeHref: string;
  marketplaceHref: string;
  marketplaceLabel: string;
  businessName: string;
  email?: string | null;
  avatarUrl?: string | null;
  statusLabel: string;
  statusClassName: string;
  statusBanner?: string | null;
  statusTone?: PartnerStatusTone;
  statusIcon?: LucideIcon;
  nav: readonly PartnerNavItem[];
  tabs: readonly PartnerTabItem[];
  pageTitles: readonly PartnerPageTitle[];
  chromeVariant?: 'default' | 'premium';
  onLogout: () => Promise<void>;
};

const MOBILE_HEADER_OFFSET = '4rem';

function groupNav(nav: readonly PartnerNavItem[]) {
  const groups: { label: string; items: PartnerNavItem[] }[] = [];
  for (const item of nav) {
    const label = item.group ?? '';
    const last = groups[groups.length - 1];
    if (!last || last.label !== label) {
      groups.push({ label, items: [item] });
    } else {
      last.items.push(item);
    }
  }
  return groups;
}

function NavLinks({
  nav,
  homeHref,
  pathname,
  onNavigate,
}: {
  nav: readonly PartnerNavItem[];
  homeHref: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const groups = groupNav(nav);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label || group.items[0]?.href}>
          {group.label ? (
            <p className="mb-1.5 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {group.label}
            </p>
          ) : null}
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isPartnerNavActive(pathname, item.href, homeHref);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
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
        </div>
      ))}
    </div>
  );
}

function IdentityBlock({
  businessName,
  email,
  avatarUrl,
  statusLabel,
  statusClassName,
  portalLabel,
}: Pick<
  PartnerDashboardChromeProps,
  'businessName' | 'email' | 'avatarUrl' | 'statusLabel' | 'statusClassName' | 'portalLabel'
>) {
  const initial =
    businessName.trim().charAt(0).toUpperCase() ||
    (email ? getEmailInitial(email) : portalLabel.charAt(0));
  const avatarColors = getAvatarColorsForLetter(initial);
  const showLogo = isRemoteProductImage(avatarUrl);

  return (
    <div className="border-b border-border px-4 py-4">
      <div className="flex items-center gap-3">
        <span
          className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold"
          style={
            showLogo
              ? undefined
              : { backgroundColor: avatarColors.background, color: avatarColors.foreground }
          }
          aria-hidden
        >
          {showLogo ? (
            <Image src={avatarUrl!} alt="" fill className="object-cover" sizes="36px" />
          ) : (
            initial
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{businessName}</p>
          {email && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={email}>
              {email}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
            statusClassName
          )}
        >
          {statusLabel}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {portalLabel}
        </span>
      </div>
    </div>
  );
}

function PartnerSidebar(props: PartnerDashboardChromeProps) {
  const {
    portalLabel,
    homeHref,
    marketplaceHref,
    marketplaceLabel,
    email,
    nav,
    onLogout,
  } = props;
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <aside className="hidden w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-card md:flex">
      <div className="border-b border-border p-6">
        <BrandLogo variant="admin" href={homeHref} />
      </div>
      <IdentityBlock {...props} />

      <nav className="flex flex-1 flex-col overflow-y-auto p-4" aria-label={`${portalLabel} navigation`}>
        <NavLinks nav={nav} homeHref={homeHref} pathname={pathname} />

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          {email && (
            <p className="truncate px-4 text-xs text-muted-foreground" title={email}>
              {email}
            </p>
          )}
          <InstallAppButton variant="sidebar" />
          <Link
            href={marketplaceHref}
            className="flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            <ExternalLink className="h-5 w-5 shrink-0" />
            {marketplaceLabel}
          </Link>
          <Button
            variant="outline"
            className="min-h-11 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true);
              try {
                await onLogout();
              } finally {
                setLoggingOut(false);
              }
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {loggingOut ? 'Signing out…' : 'Logout'}
          </Button>
        </div>
      </nav>
    </aside>
  );
}

function PartnerMobileHeader({
  portalLabel,
  pageTitles,
  marketplaceHref,
  marketplaceLabel,
  premium = false,
}: Pick<
  PartnerDashboardChromeProps,
  'portalLabel' | 'pageTitles' | 'marketplaceHref' | 'marketplaceLabel'
> & { premium?: boolean }) {
  const { navOpen, toggleNav, setNavOpen } = usePartnerShell();
  const pathname = usePathname();
  const title = getPartnerPageTitle(pathname, pageTitles);

  return (
    <header
      className={cn(
        'sticky top-0 z-[60] flex h-16 shrink-0 items-center gap-3 md:hidden',
        premium
          ? 'border-b border-white/50 bg-card/88 px-4 shadow-[0_4px_24px_oklch(0.40_0.13_340_/_5%)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/82'
          : 'border-b border-border bg-card/95 px-4 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/90'
      )}
      onClick={() => {
        if (navOpen) setNavOpen(false);
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleNav();
        }}
        aria-expanded={navOpen}
        aria-controls="partner-mobile-nav"
        aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition duration-300',
          navOpen
            ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
            : premium
              ? 'border-white/70 bg-white/60 shadow-sm hover:bg-white/80'
              : 'border-border bg-background hover:bg-secondary'
        )}
      >
        {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          ShiQueen {portalLabel}
        </p>
        <p className="truncate text-base font-semibold leading-tight tracking-tight">{title}</p>
      </div>

      <Link
        href={marketplaceHref}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition duration-300',
          premium
            ? 'border-primary/15 bg-primary/5 text-primary hover:bg-primary/10'
            : 'border-border bg-background text-primary hover:bg-primary/5'
        )}
      >
        {marketplaceLabel === 'Storefront' ? 'Store' : marketplaceLabel}
      </Link>
    </header>
  );
}

function PartnerMobileDrawer(props: PartnerDashboardChromeProps) {
  const {
    portalLabel,
    homeHref,
    marketplaceHref,
    marketplaceLabel,
    email,
    nav,
    onLogout,
  } = props;
  const pathname = usePathname();
  const { navOpen, setNavOpen } = usePartnerShell();
  const [loggingOut, setLoggingOut] = useState(false);
  const close = () => setNavOpen(false);

  return (
    <>
      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-[45] cursor-default bg-black/60 backdrop-blur-[2px] md:hidden"
          onClick={close}
        />
      )}

      <aside
        id="partner-mobile-nav"
        style={{ top: MOBILE_HEADER_OFFSET, height: `calc(100dvh - ${MOBILE_HEADER_OFFSET})` }}
        className={cn(
          'fixed left-0 z-50 flex w-[min(20rem,82vw)] flex-col overflow-hidden',
          'border-r shadow-2xl transition-transform duration-300 ease-out md:hidden',
          props.chromeVariant === 'premium'
            ? 'border-white/50 bg-card/95 backdrop-blur-xl'
            : 'border-border/80 bg-card',
          navOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        )}
        onClick={(e) => e.stopPropagation()}
        aria-hidden={!navOpen}
      >
        <IdentityBlock {...props} />

        <nav className="min-h-0 flex-1 overflow-y-auto p-2" aria-label={`${portalLabel} navigation`}>
          <NavLinks nav={nav} homeHref={homeHref} pathname={pathname} onNavigate={close} />
        </nav>

        <div className="shrink-0 border-t border-border/60 bg-muted/15 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <InstallAppButton variant="drawer" />
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href={marketplaceHref}
              onClick={close}
              className="flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-card text-[11px] font-semibold transition hover:bg-secondary sm:h-9 sm:text-xs"
            >
              <ExternalLink className="h-3 w-3" />
              {marketplaceLabel === 'Storefront' ? 'Store' : marketplaceLabel}
            </Link>
            <button
              type="button"
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                try {
                  await onLogout();
                  close();
                } finally {
                  setLoggingOut(false);
                }
              }}
              className="flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-card text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 sm:h-9 sm:text-xs dark:hover:bg-red-950/20"
            >
              <LogOut className="h-3 w-3" />
              {loggingOut ? '…' : 'Sign out'}
            </button>
          </div>
          {email && (
            <p className="mt-2 truncate px-1 text-center text-[11px] text-muted-foreground" title={email}>
              {email}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

function PartnerTabBar({
  tabs,
  homeHref,
  premium = false,
}: {
  tabs: readonly PartnerTabItem[];
  homeHref: string;
  premium?: boolean;
}) {
  const pathname = usePathname();
  const { navOpen, toggleNav } = usePartnerShell();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed inset-x-0 bottom-0 z-[55] pb-[max(0.4rem,env(safe-area-inset-bottom))] md:hidden',
        premium
          ? 'partner-premium-tab-bar border-t border-white/60 bg-card/88 shadow-[0_-8px_32px_oklch(0.40_0.13_340_/_6%)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/82'
          : 'border-t border-border bg-card/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/90'
      )}
    >
      <div className="grid h-[3.75rem] grid-cols-4 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.action === 'more'
              ? navOpen
              : tab.href
                ? isPartnerNavActive(pathname, tab.href, homeHref)
                : false;
          const tabClass = cn(
            'relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-wide transition-all duration-300 ease-out',
            active
              ? premium
                ? 'text-primary'
                : 'text-primary'
              : premium
                ? 'text-muted-foreground/75 active:scale-95'
                : 'text-muted-foreground'
          );
          const activeIndicator = active ? (
            <span
              className={cn(
                'pointer-events-none absolute inset-x-1.5 inset-y-1 rounded-2xl',
                premium
                  ? 'bg-gradient-to-b from-primary/14 to-primary/6 ring-1 ring-primary/10'
                  : 'bg-primary/8'
              )}
              aria-hidden
            />
          ) : null;
          if (tab.action === 'more') {
            return (
              <button
                key={tab.label}
                type="button"
                onClick={toggleNav}
                className={tabClass}
              >
                {activeIndicator}
                <Icon className={cn('relative h-5 w-5', active && premium && 'drop-shadow-sm')} />
                <span className="relative">{tab.label}</span>
              </button>
            );
          }
          return (
            <Link key={tab.href} href={tab.href!} className={tabClass}>
              {activeIndicator}
              <Icon className={cn('relative h-5 w-5', active && premium && 'drop-shadow-sm')} />
              <span className="relative">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function PartnerDashboardChromeInner(props: PartnerDashboardChromeProps) {
  const { children, statusBanner, statusTone, statusIcon: StatusIcon, chromeVariant = 'default' } =
    props;
  const premium = chromeVariant === 'premium';
  const { navOpen, setNavOpen } = usePartnerShell();
  const pathname = usePathname();
  const paneRef = useRef<HTMLDivElement>(null);
  const [slideIn] = useState(readPartnerTabSlideIn);

  usePartnerTabSwipe({
    tabs: props.tabs,
    homeHref: props.homeHref,
    pathname,
    navOpen,
    setNavOpen,
    paneRef,
  });

  return (
    <div
      className={cn(
        figtree.className,
        'partner-app flex h-[100dvh] flex-col overflow-hidden bg-background',
        premium && 'partner-premium-app'
      )}
      data-chrome={chromeVariant}
    >
      <PartnerMobileHeader
        portalLabel={props.portalLabel}
        pageTitles={props.pageTitles}
        marketplaceHref={props.marketplaceHref}
        marketplaceLabel={props.marketplaceLabel}
        premium={premium}
      />
      <PartnerMobileDrawer {...props} />

      <div className="flex min-h-0 flex-1 md:flex-row">
        <PartnerSidebar {...props} />
        <main
          className={cn(
            'min-w-0 flex-1 overflow-x-hidden overflow-y-auto',
            premium && 'partner-premium-main'
          )}
          onClick={() => {
            if (navOpen) setNavOpen(false);
          }}
        >
          <div
            ref={paneRef}
            className={cn(
              'partner-tab-pane min-h-full will-change-transform',
              slideIn === 'next' && 'partner-tab-enter-next',
              slideIn === 'prev' && 'partner-tab-enter-prev'
            )}
          >
            <EmailVerificationBanner />
            {statusBanner && statusTone ? (
              <div
                className={cn(
                  'border-b px-4 py-3 text-sm sm:px-6',
                  statusTone === 'pending' && 'border-amber-200/70 bg-amber-50 text-amber-900',
                  statusTone === 'rejected' && 'border-rose-200/70 bg-rose-50 text-rose-900',
                  statusTone === 'suspended' && 'border-slate-200/80 bg-slate-50 text-slate-800'
                )}
              >
                <div className="mx-auto flex max-w-6xl gap-2">
                  {StatusIcon ? <StatusIcon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" /> : null}
                  <p>{statusBanner}</p>
                </div>
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
      <PartnerTabBar tabs={props.tabs} homeHref={props.homeHref} premium={premium} />
      <PartnerPwaRuntime />
    </div>
  );
}

export function PartnerDashboardChrome(props: PartnerDashboardChromeProps) {
  return (
    <PartnerShellProvider>
      <PartnerDashboardChromeInner {...props} />
    </PartnerShellProvider>
  );
}
