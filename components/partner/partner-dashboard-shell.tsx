'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
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
import { getEmailInitial } from '@/lib/user-display';
import { figtree } from '@/lib/fonts';
import { cn } from '@/lib/utils';

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
  statusLabel: string;
  statusClassName: string;
  statusBanner?: string | null;
  statusTone?: PartnerStatusTone;
  statusIcon?: LucideIcon;
  nav: readonly PartnerNavItem[];
  tabs: readonly PartnerTabItem[];
  pageTitles: readonly PartnerPageTitle[];
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
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label || group.items[0]?.href}>
          {group.label ? (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              {group.label}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isPartnerNavActive(pathname, item.href, homeHref);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition',
                    active
                      ? 'bg-primary/[0.09] text-primary shadow-[inset_0_0_0_1px_oklch(0.40_0.13_340_/_0.1)]'
                      : 'text-foreground/70 hover:bg-white/70 hover:text-foreground'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'opacity-70')} />
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
  statusLabel,
  statusClassName,
  portalLabel,
}: Pick<
  PartnerDashboardChromeProps,
  'businessName' | 'email' | 'statusLabel' | 'statusClassName' | 'portalLabel'
>) {
  const initial =
    businessName.trim().charAt(0).toUpperCase() ||
    (email ? getEmailInitial(email) : portalLabel.charAt(0));

  return (
    <div className="px-4 py-5">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8C9D2] to-[#D4B48A] font-brand text-lg text-white shadow-sm"
          aria-hidden
        >
          {initial}
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="truncate font-brand text-[15px] font-medium leading-tight tracking-tight">
            {businessName}
          </p>
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
            'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset',
            statusClassName
          )}
        >
          {statusLabel}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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
    nav,
    onLogout,
  } = props;
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <aside className="hidden w-[17rem] shrink-0 flex-col overflow-hidden border-r border-[var(--partner-line)] bg-[var(--partner-sidebar)] md:flex">
      <div className="border-b border-[var(--partner-line)] px-5 py-5">
        <BrandLogo variant="icon" href={homeHref} />
      </div>
      <IdentityBlock {...props} />

      <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 pb-3" aria-label={`${portalLabel} navigation`}>
        <NavLinks nav={nav} homeHref={homeHref} pathname={pathname} />

        <div className="mt-auto space-y-1.5 border-t border-[var(--partner-line)] pt-3">
          <Link
            href={marketplaceHref}
            className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-foreground/70 transition hover:bg-white/70 hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4 shrink-0 opacity-70" />
            {marketplaceLabel}
          </Link>
          <Button
            variant="ghost"
            className="min-h-10 w-full justify-start rounded-xl px-3 text-[13px] text-[#9A4A52] hover:bg-[#F6E4E6] hover:text-[#7A3B42]"
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
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </nav>
    </aside>
  );
}

function PartnerMobileHeader({
  portalLabel,
  pageTitles,
  statusLabel,
  statusClassName,
}: Pick<
  PartnerDashboardChromeProps,
  'portalLabel' | 'pageTitles' | 'statusLabel' | 'statusClassName'
>) {
  const { navOpen, toggleNav, setNavOpen } = usePartnerShell();
  const pathname = usePathname();
  const title = getPartnerPageTitle(pathname, pageTitles);

  return (
    <header
      className={cn(
        'sticky top-0 z-[60] flex h-16 shrink-0 items-center gap-3 border-b border-[var(--partner-line)]',
        'bg-[var(--partner-sidebar)]/90 px-4 backdrop-blur-xl md:hidden'
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
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition',
          navOpen
            ? 'border-primary/20 bg-primary text-primary-foreground shadow-sm'
            : 'border-[var(--partner-line)] bg-white/80 hover:bg-white'
        )}
      >
        {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">
          {portalLabel}
        </p>
        <p className="truncate font-brand text-lg font-medium leading-tight tracking-tight">{title}</p>
      </div>

      <span
        className={cn(
          'hidden truncate rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset sm:inline-flex',
          statusClassName
        )}
      >
        {statusLabel}
      </span>
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
          className="fixed inset-0 z-[45] cursor-default bg-[#3A2430]/40 backdrop-blur-[2px] md:hidden"
          onClick={close}
        />
      )}

      <aside
        id="partner-mobile-nav"
        style={{ top: MOBILE_HEADER_OFFSET, height: `calc(100dvh - ${MOBILE_HEADER_OFFSET})` }}
        className={cn(
          'fixed left-0 z-50 flex w-[min(20rem,84vw)] flex-col overflow-hidden',
          'border-r border-[var(--partner-line)] bg-[var(--partner-sidebar)] shadow-2xl transition-transform duration-300 ease-out md:hidden',
          navOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        )}
        aria-hidden={!navOpen}
      >
        <IdentityBlock {...props} />

        <nav className="min-h-0 flex-1 overflow-y-auto px-2.5" aria-label={`${portalLabel} navigation`}>
          <NavLinks nav={nav} homeHref={homeHref} pathname={pathname} onNavigate={close} />
        </nav>

        <div className="shrink-0 border-t border-[var(--partner-line)] bg-[#F7F1EC]/70 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href={marketplaceHref}
              onClick={close}
              className="flex h-10 items-center justify-center gap-1 rounded-xl border border-[var(--partner-line)] bg-white/80 text-[11px] font-semibold"
            >
              <ExternalLink className="h-3 w-3" />
              {marketplaceLabel}
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
              className="flex h-10 items-center justify-center gap-1 rounded-xl border border-[var(--partner-line)] bg-white/80 text-[11px] font-semibold text-[#9A4A52] disabled:opacity-50"
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
}: {
  tabs: readonly PartnerTabItem[];
  homeHref: string;
}) {
  const pathname = usePathname();
  const { navOpen, toggleNav } = usePartnerShell();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-[55] border-t border-[var(--partner-line)] bg-[var(--partner-sidebar)]/95 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
    >
      <div className="grid h-14 grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.action === 'more'
              ? navOpen
              : tab.href
                ? isPartnerNavActive(pathname, tab.href, homeHref)
                : false;
          if (tab.action === 'more') {
            return (
              <button
                key={tab.label}
                type="button"
                onClick={toggleNav}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href!}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function PartnerDashboardChromeInner(props: PartnerDashboardChromeProps) {
  const { children, statusBanner, statusTone, statusIcon: StatusIcon } = props;
  const { navOpen, setNavOpen } = usePartnerShell();

  return (
    <div
      className={cn(
        figtree.className,
        'partner-app partner-canvas-wash flex h-[100dvh] flex-col overflow-hidden'
      )}
    >
      <PartnerMobileHeader
        portalLabel={props.portalLabel}
        pageTitles={props.pageTitles}
        statusLabel={props.statusLabel}
        statusClassName={props.statusClassName}
      />
      <PartnerMobileDrawer {...props} />

      <div className="flex min-h-0 flex-1 md:flex-row">
        <PartnerSidebar {...props} />
        <main
          className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
          onClick={() => {
            if (navOpen) setNavOpen(false);
          }}
        >
          <EmailVerificationBanner />
          {statusBanner && statusTone ? (
            <div
              className={cn(
                'border-b px-4 py-3 text-sm sm:px-6',
                statusTone === 'pending' && 'border-[#E8D4B0]/80 bg-[#FBF3E6] text-[#6B4A1E]',
                statusTone === 'rejected' && 'border-[#E8C4C8]/80 bg-[#F8ECEC] text-[#6B3036]',
                statusTone === 'suspended' && 'border-[#D8D2CC]/80 bg-[#F3EFEA] text-[#4A433E]'
              )}
            >
              <div className="mx-auto flex max-w-6xl gap-2">
                {StatusIcon ? <StatusIcon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" /> : null}
                <p>{statusBanner}</p>
              </div>
            </div>
          ) : null}
          {children}
        </main>
      </div>
      <PartnerTabBar tabs={props.tabs} homeHref={props.homeHref} />
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
