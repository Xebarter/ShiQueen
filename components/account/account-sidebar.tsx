'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AccountAvatar } from '@/components/account/account-avatar';
import {
  ACCOUNT_BACK_LINK,
  ACCOUNT_LOGOUT_LINK,
  ACCOUNT_SECTIONS,
  type AccountSection,
} from '@/components/account/account-nav-items';
import { cn } from '@/lib/utils';

type AccountSidebarProps = {
  activeSection: AccountSection;
  onNavigate: (section: AccountSection) => void;
  displayName: string;
  email: string | null | undefined;
  memberSinceLabel?: string | null;
  signingOut?: boolean;
  onLogout: () => void;
  className?: string;
};

export function AccountSidebar({
  activeSection,
  onNavigate,
  displayName,
  email,
  memberSinceLabel,
  signingOut,
  onLogout,
  className,
}: AccountSidebarProps) {
  const BackIcon = ACCOUNT_BACK_LINK.icon;
  const LogoutIcon = ACCOUNT_LOGOUT_LINK.icon;

  return (
    <aside
      className={cn(
        'sticky top-24 flex flex-col gap-4 self-start',
        className
      )}
    >
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.06] via-card to-card shadow-sm ring-1 ring-black/[0.02]">
        <div className="border-b border-border/50 px-5 py-5">
          <div className="flex items-center gap-3">
            <AccountAvatar email={email} variant="email-letter" size="md" />
            <div className="min-w-0">
              <p className="truncate font-semibold tracking-tight">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          {memberSinceLabel ? (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Member since{' '}
              <span className="font-medium text-foreground">{memberSinceLabel}</span>
            </p>
          ) : null}
        </div>

        <nav className="flex flex-col gap-0.5 p-2" aria-label="Account navigation">
          {ACCOUNT_SECTIONS.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {active ? (
                  <span
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-primary/15 text-primary' : 'bg-muted/60 text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border/50 p-2">
          <Link
            href={ACCOUNT_BACK_LINK.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
              <BackIcon className="h-4 w-4" />
            </span>
            {ACCOUNT_BACK_LINK.label}
          </Link>
          <button
            type="button"
            onClick={onLogout}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive disabled:opacity-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogoutIcon className="h-4 w-4" />
              )}
            </span>
            {signingOut ? 'Signing out…' : ACCOUNT_LOGOUT_LINK.label}
          </button>
        </div>
      </div>
    </aside>
  );
}
