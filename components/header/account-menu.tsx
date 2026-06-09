'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, LogOut, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { AccountAvatar } from '@/components/account/account-avatar';
import { useAuth } from '@/lib/auth-context';
import { getDisplayName } from '@/lib/user-display';
import { cn } from '@/lib/utils';
import { useHistoryOverlay } from '@/lib/hooks/use-history-overlay';

export function HeaderAccountMenu() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const displayName = getDisplayName(profile?.displayName ?? user?.displayName, user?.email);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  }, [clearCloseTimer]);

  const closeMenu = useCallback(() => setOpen(false), []);

  useHistoryOverlay(open, closeMenu);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      setOpen(false);
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Unable to sign out. Please try again.');
      console.error(error);
      setSigningOut(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex rounded-full border border-transparent p-2.5 text-foreground/75 transition-all duration-200 hover:border-border/60 hover:bg-secondary/80 hover:text-primary hover:shadow-sm"
        aria-label="Sign in"
      >
        <User className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'inline-flex rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          open && 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <AccountAvatar email={user.email} variant="email-letter" size="sm" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-[calc(100%+0.625rem)] z-50 w-[15.5rem] origin-top-right"
            role="menu"
            aria-label="Account options"
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
          >
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-primary/8 ring-1 ring-border/50">
              <div className="relative border-b border-border/60 bg-gradient-to-br from-secondary/70 via-secondary/35 to-accent/10 px-4 py-3.5">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/70 via-primary/40 to-accent/50" />
                <div className="flex items-center gap-3">
                  <AccountAvatar email={user.email} variant="email-letter" size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium tracking-tight text-foreground">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-1.5">
                <Link
                  href="/account"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium tracking-wide text-foreground/90 transition-colors hover:bg-secondary hover:text-primary"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <User className="h-4 w-4" />
                  </span>
                  My Account
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/45 transition-colors group-hover:text-primary/70" />
                </Link>

                <div className="my-1 h-px bg-border/60" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-muted/80 group-hover:text-foreground">
                    <LogOut className="h-4 w-4" />
                  </span>
                  {signingOut ? 'Signing out…' : 'Sign Out'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
