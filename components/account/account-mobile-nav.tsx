'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Loader2, Menu, X } from 'lucide-react';
import { AccountAvatar } from '@/components/account/account-avatar';
import {
  ACCOUNT_BACK_LINK,
  ACCOUNT_LOGOUT_LINK,
  ACCOUNT_SECTIONS,
  getAccountSectionMeta,
  type AccountSection,
} from '@/components/account/account-nav-items';
import { useHistoryOverlay } from '@/lib/hooks/use-history-overlay';
import { cn } from '@/lib/utils';

type AccountMobileNavProps = {
  activeSection: AccountSection;
  onNavigate: (section: AccountSection) => void;
  displayName: string;
  email: string | null | undefined;
  signingOut?: boolean;
  onLogout: () => void;
};

export function AccountMobileNav({
  activeSection,
  onNavigate,
  displayName,
  email,
  signingOut,
  onLogout,
}: AccountMobileNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sectionMeta = getAccountSectionMeta(activeSection);
  const BackIcon = ACCOUNT_BACK_LINK.icon;
  const LogoutIcon = ACCOUNT_LOGOUT_LINK.icon;

  useHistoryOverlay(menuOpen, () => setMenuOpen(false));

  const closeMenu = () => setMenuOpen(false);

  const handleNavigate = (section: AccountSection) => {
    onNavigate(section);
    closeMenu();
  };

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="sticky top-0 z-30 mb-6 lg:hidden">
      <header
        className={cn(
          'relative z-30 flex items-center gap-3 rounded-2xl border border-border/60 bg-card/95 px-3 py-2.5 shadow-sm ring-1 ring-black/[0.02]',
          'backdrop-blur-md supports-[backdrop-filter]:bg-card/90'
        )}
      >
        <div className="relative shrink-0">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="account-mobile-menu"
            aria-label={menuOpen ? 'Close account menu' : 'Open account menu'}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl border transition',
              menuOpen
                ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background hover:bg-muted/60'
            )}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <AnimatePresence>
            {menuOpen ? (
              <>
                <motion.button
                  type="button"
                  aria-label="Close account menu"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
                  onClick={closeMenu}
                />

                <motion.div
                  ref={menuRef}
                  id="account-mobile-menu"
                  role="menu"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(18.5rem,calc(100vw-2rem))]',
                    'overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl ring-1 ring-black/[0.04]'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.06] via-card to-card px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <AccountAvatar displayName={displayName} email={email} variant="email-letter" size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tracking-tight">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{email}</p>
                      </div>
                    </div>
                  </div>

                  <nav className="flex flex-col p-1.5" aria-label="Account menu">
                    {ACCOUNT_SECTIONS.map(({ id, label, description, icon: Icon }) => {
                      const active = activeSection === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          role="menuitem"
                          onClick={() => handleNavigate(id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'text-foreground hover:bg-muted/60'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                              active ? 'bg-primary/15 text-primary' : 'bg-muted/60 text-muted-foreground'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{label}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {description}
                            </span>
                          </span>
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 shrink-0',
                              active ? 'text-primary/70' : 'text-muted-foreground/50'
                            )}
                          />
                        </button>
                      );
                    })}
                  </nav>

                  <div className="border-t border-border/50 p-1.5">
                    <Link
                      href={ACCOUNT_BACK_LINK.href}
                      role="menuitem"
                      onClick={closeMenu}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                        <BackIcon className="h-4 w-4" />
                      </span>
                      {ACCOUNT_BACK_LINK.label}
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        closeMenu();
                        onLogout();
                      }}
                      disabled={signingOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive disabled:opacity-50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                        {signingOut ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogoutIcon className="h-4 w-4" />
                        )}
                      </span>
                      {signingOut ? 'Signing out…' : ACCOUNT_LOGOUT_LINK.label}
                    </button>
                  </div>
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            My account
          </p>
          <p className="truncate text-base font-semibold leading-tight tracking-tight">
            {sectionMeta.label}
          </p>
        </div>

        <AccountAvatar displayName={displayName} email={email} variant="email-letter" size="sm" />
      </header>
    </div>
  );
}
