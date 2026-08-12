'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { ShoppingCart, Menu, X, Heart } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SearchBar } from './search-bar';
import { BrandLogo } from './brand-logo';
import { HeaderAccountMenu } from '@/components/header/account-menu';
import {
  MobileDrawer,
  getMobileDrawerTransition,
  mobileDrawerShellClassName,
} from '@/components/header/mobile-drawer';
import { cn } from '@/lib/utils';
import { getStoredWishlist } from '@/lib/home-merchandising';
import { MAIN_NAV_LINKS } from '@/lib/site-nav';
import { useHistoryOverlay } from '@/lib/hooks/use-history-overlay';

const NAV_LINKS = MAIN_NAV_LINKS;

function NavLink({
  href,
  label,
  onClick,
  className,
}: {
  href: string;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive =
    href === '/shop'
      ? pathname === '/shop' || pathname.startsWith('/products/')
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group relative text-sm font-medium tracking-wide transition-colors duration-200',
        isActive ? 'text-primary' : 'text-foreground/70 hover:text-primary',
        className
      )}
    >
      {label}
      <span
        className={cn(
          'absolute -bottom-1 left-0 h-0.5 rounded-full bg-gradient-to-r from-primary via-accent to-primary/40 transition-all duration-300',
          isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
        )}
      />
    </Link>
  );
}

const menuMotionEase = [0.32, 0.72, 0, 1] as const;

function MobileMenuButton({
  open,
  onClick,
  className,
}: {
  open: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex rounded-full border border-transparent p-2.5 text-foreground/75 transition-colors duration-200',
        'hover:border-border/60 hover:bg-secondary/80 hover:text-primary hover:shadow-sm',
        className
      )}
      aria-expanded={open}
      aria-label={open ? 'Close menu' : 'Open menu'}
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <motion.span
          aria-hidden
          initial={false}
          animate={{
            opacity: open ? 0 : 1,
            rotate: open ? 90 : 0,
            scale: open ? 0.6 : 1,
          }}
          transition={{ duration: 0.22, ease: menuMotionEase }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Menu className="h-5 w-5" />
        </motion.span>
        <motion.span
          aria-hidden
          initial={false}
          animate={{
            opacity: open ? 1 : 0,
            rotate: open ? 0 : -90,
            scale: open ? 1 : 0.6,
          }}
          transition={{ duration: 0.22, ease: menuMotionEase }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <X className="h-5 w-5" />
        </motion.span>
      </span>
    </button>
  );
}

export function Header() {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isPhoneLayout, setIsPhoneLayout] = useState(false);
  const [primaryHeaderVisible, setPrimaryHeaderVisible] = useState(true);
  const primaryHeaderRef = useRef<HTMLElement>(null);
  const mobileSearchBarRef = useRef<HTMLDivElement>(null);
  const [primaryHeaderHeight, setPrimaryHeaderHeight] = useState(68);
  const [mobileSearchBarHeight, setMobileSearchBarHeight] = useState(52);
  const prefersReducedMotion = useReducedMotion();

  const wishlistHref = user ? '/account#wishlist' : '/sign-in';
  const showMenuInPrimary = isPhoneLayout && primaryHeaderVisible;
  const showMenuInSearchBar = isPhoneLayout && !primaryHeaderVisible;

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((open) => !open);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useHistoryOverlay(mobileMenuOpen, closeMobileMenu);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const syncWishlistCount = () => setWishlistCount(getStoredWishlist().length);
    syncWishlistCount();
    window.addEventListener('wishlist-updated', syncWishlistCount);
    window.addEventListener('storage', syncWishlistCount);
    return () => {
      window.removeEventListener('wishlist-updated', syncWishlistCount);
      window.removeEventListener('storage', syncWishlistCount);
    };
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const updateLayout = () => setIsPhoneLayout(media.matches);
    updateLayout();
    media.addEventListener('change', updateLayout);
    return () => media.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    if (!isPhoneLayout) {
      setPrimaryHeaderVisible(true);
      return;
    }

    const header = primaryHeaderRef.current;
    if (!header) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPrimaryHeaderVisible(entry.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(header);
    return () => observer.disconnect();
  }, [isPhoneLayout, pathname]);

  useEffect(() => {
    const primary = primaryHeaderRef.current;
    const searchBar = mobileSearchBarRef.current;
    if (!primary || !searchBar) return;

    const syncHeights = () => {
      setPrimaryHeaderHeight(primary.offsetHeight);
      setMobileSearchBarHeight(searchBar.offsetHeight);
    };

    syncHeights();
    const observer = new ResizeObserver(syncHeights);
    observer.observe(primary);
    observer.observe(searchBar);
    window.addEventListener('resize', syncHeights);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncHeights);
    };
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(max-width: 1023px)');

    const syncHeaderVars = () => {
      if (!media.matches) {
        root.style.removeProperty('--header-primary-height');
        root.style.removeProperty('--mobile-search-height');
        root.style.removeProperty('--mobile-header-offset');
        return;
      }

      root.style.setProperty('--header-primary-height', `${primaryHeaderHeight}px`);
      root.style.setProperty('--mobile-search-height', `${mobileSearchBarHeight}px`);
      root.style.setProperty(
        '--mobile-header-offset',
        media.matches && window.matchMedia('(max-width: 767px)').matches
          ? `${mobileSearchBarHeight}px`
          : `${primaryHeaderHeight + mobileSearchBarHeight}px`
      );
    };

    syncHeaderVars();
    media.addEventListener('change', syncHeaderVars);
    window.addEventListener('resize', syncHeaderVars);
    return () => {
      media.removeEventListener('change', syncHeaderVars);
      window.removeEventListener('resize', syncHeaderVars);
    };
  }, [primaryHeaderHeight, mobileSearchBarHeight]);

  return (
    <>
      {/* Primary header — scrolls away on phone, sticky on tablet+ */}
      <header
        ref={primaryHeaderRef}
        className={cn(
          'z-40 border-b border-border/50 bg-background/95 shadow-sm shadow-primary/[0.03] max-md:relative max-md:bg-background',
          'md:sticky md:top-0 md:backdrop-blur-xl md:supports-[backdrop-filter]:bg-background/85',
          'lg:sticky lg:top-0'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.25rem] items-center justify-between gap-4 lg:h-[4.5rem]">
            <BrandLogo variant="header" />

            <nav className="hidden items-center gap-1 lg:flex xl:gap-2">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  className="rounded-lg px-3 py-2"
                />
              ))}
            </nav>

            <div className="hidden flex-1 justify-center px-4 lg:flex lg:max-w-sm xl:max-w-md">
              <SearchBar />
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <HeaderAccountMenu />

              <Link
                href={wishlistHref}
                className="relative hidden rounded-full border border-transparent p-2.5 text-foreground/75 transition-all duration-200 hover:border-border/60 hover:bg-secondary/80 hover:text-primary hover:shadow-sm md:inline-flex"
                aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ''}`}
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="relative hidden rounded-full border border-transparent p-2.5 text-foreground/75 transition-all duration-200 hover:border-border/60 hover:bg-secondary/80 hover:text-primary hover:shadow-sm lg:inline-flex"
                aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground">
                    {itemCount}
                  </span>
                )}
              </Link>

              {showMenuInPrimary && (
                <MobileMenuButton
                  open={mobileMenuOpen}
                  onClick={toggleMobileMenu}
                  className="md:hidden"
                />
              )}
            </div>
          </div>
        </div>

        {/* Tablet nav */}
        <nav className="hidden border-t border-border/40 bg-muted/20 md:flex lg:hidden">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs"
              />
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile search bar — sticky (native scroll, no JS position updates) */}
      <div
        ref={mobileSearchBarRef}
        className={cn(
          'z-50 border-b border-border/50 bg-background max-md:sticky max-md:top-0 max-md:bg-background lg:hidden',
          'md:sticky md:bg-background/95 md:backdrop-blur-xl md:supports-[backdrop-filter]:bg-background/90',
          'md:top-[var(--header-primary-height,4.25rem)]'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-2.5 sm:gap-2 sm:px-6">
          <div
            className={cn(
              'shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden',
              showMenuInSearchBar ? 'w-10 opacity-100' : 'w-0 opacity-0'
            )}
            aria-hidden={!showMenuInSearchBar}
          >
            <MobileMenuButton
              open={mobileMenuOpen}
              onClick={toggleMobileMenu}
              className={cn(!showMenuInSearchBar && 'pointer-events-none')}
            />
          </div>

          <SearchBar className="max-w-none flex-1" />

          <Link
            href={wishlistHref}
            className="relative flex shrink-0 items-center justify-center rounded-full border border-transparent p-2 text-foreground/75 transition-all duration-200 hover:border-border/60 hover:bg-secondary/80 hover:text-primary hover:shadow-sm md:hidden"
            aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ''}`}
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="relative flex shrink-0 items-center justify-center rounded-full border border-transparent p-2 text-foreground/75 transition-all duration-200 hover:border-border/60 hover:bg-secondary/80 hover:text-primary hover:shadow-sm lg:hidden"
            aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.button
            key="mobile-menu-backdrop"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38, ease: menuMotionEase }}
            className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px] md:hidden"
            aria-label="Close menu"
            onClick={closeMobileMenu}
          />
        )}
        {mobileMenuOpen && (
          <motion.aside
            key="mobile-menu-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={getMobileDrawerTransition(prefersReducedMotion ?? false)}
            className={mobileDrawerShellClassName}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <MobileDrawer
              onClose={closeMobileMenu}
              user={user}
              itemCount={itemCount}
              wishlistCount={wishlistCount}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
