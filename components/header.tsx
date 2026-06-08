'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { ShoppingCart, User, Menu, X, ChevronRight, Heart } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from './search-bar';
import { BrandLogo } from './brand-logo';
import { HeaderAccountMenu } from '@/components/header/account-menu';
import { cn } from '@/lib/utils';
import { getStoredWishlist } from '@/lib/home-merchandising';

const NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/collections', label: 'Collections' },
  { href: '/loyalty', label: 'Rewards' },
  { href: '/wholesale', label: 'Wholesale' },
];

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
        'group relative text-sm font-medium tracking-wide transition-colors',
        isActive ? 'text-primary' : 'text-foreground/75 hover:text-primary',
        className
      )}
    >
      {label}
      <span
        className={cn(
          'absolute -bottom-1 left-0 h-px bg-accent transition-all duration-300',
          isActive ? 'w-full' : 'w-0 group-hover:w-full'
        )}
      />
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  index,
  onClick,
}: {
  href: string;
  label: string;
  index: number;
  onClick: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    href === '/shop'
      ? pathname === '/shop' || pathname.startsWith('/products/')
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + index * 0.04, duration: 0.3 }}
    >
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          'flex items-center justify-between border-b border-border/40 py-4 transition-colors',
          isActive ? 'text-primary' : 'text-foreground/85 hover:text-primary'
        )}
      >
        <span className="text-sm font-medium tracking-wide">{label}</span>
        <ChevronRight
          className={cn(
            'h-4 w-4 transition-transform',
            isActive ? 'text-accent' : 'text-muted-foreground/60'
          )}
        />
      </Link>
    </motion.div>
  );
}

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
        'inline-flex rounded-full p-2.5 text-foreground/80 transition-colors hover:bg-secondary hover:text-primary',
        className
      )}
      aria-expanded={open}
      aria-label={open ? 'Close menu' : 'Open menu'}
    >
      {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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

  const wishlistHref = user ? '/account#wishlist' : '/sign-in';
  const showMenuInPrimary = isPhoneLayout && primaryHeaderVisible;
  const showMenuInSearchBar = isPhoneLayout && !primaryHeaderVisible;

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((open) => !open);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

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
          'z-40 border-b border-border/60 bg-background max-md:relative',
          'md:sticky md:top-0 md:bg-background/90 md:backdrop-blur-md md:supports-[backdrop-filter]:bg-background/80',
          'lg:sticky lg:top-0'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.25rem] items-center justify-between gap-4">
            <BrandLogo variant="header" />

            <nav className="hidden items-center gap-7 lg:flex xl:gap-8">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} />
              ))}
            </nav>

            <div className="hidden flex-1 justify-center px-4 lg:flex lg:max-w-sm xl:max-w-md">
              <SearchBar />
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <HeaderAccountMenu />

              <Link
                href={wishlistHref}
                className="relative inline-flex rounded-full p-2.5 text-foreground/80 transition-colors hover:bg-secondary hover:text-primary lg:hidden"
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
                className="relative hidden rounded-full p-2.5 text-foreground/80 transition-colors hover:bg-secondary hover:text-primary lg:inline-flex"
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
        <nav className="hidden border-t border-border/40 md:flex lg:hidden">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-6 overflow-x-auto px-4 py-2.5 scrollbar-hide">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                className="whitespace-nowrap text-xs"
              />
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile search bar — sticky (native scroll, no JS position updates) */}
      <div
        ref={mobileSearchBarRef}
        className={cn(
          'z-50 border-b border-border/50 bg-background lg:hidden',
          'max-md:sticky max-md:top-0',
          'md:sticky md:bg-background/95 md:backdrop-blur-md md:supports-[backdrop-filter]:bg-background/90',
          'md:top-[var(--header-primary-height,4.25rem)]'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6">
          <div
            className={cn(
              'shrink-0 overflow-hidden transition-[width,opacity] duration-200 ease-out md:hidden',
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
            href="/cart"
            className="relative flex shrink-0 items-center justify-center rounded-full p-2.5 text-foreground/80 transition-colors hover:bg-secondary hover:text-primary lg:hidden"
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
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px] md:hidden"
              aria-label="Close menu"
              onClick={closeMobileMenu}
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-[70] flex w-1/2 min-w-[17.5rem] max-w-[22rem] flex-col border-l border-border/50 bg-gradient-to-b from-background via-background to-secondary/30 shadow-[-12px_0_40px_rgba(0,0,0,0.12)] md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-5">
                <BrandLogo variant="header" href="/" onClick={closeMobileMenu} />
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-secondary hover:text-primary"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-5 py-4">
                <p className="mb-1 py-3 text-sm font-medium text-muted-foreground">Menu</p>
                {NAV_LINKS.map((link, index) => (
                  <MobileNavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    index={index}
                    onClick={closeMobileMenu}
                  />
                ))}
              </nav>

              <div className="mt-auto space-y-3 border-t border-border/50 bg-secondary/20 px-5 py-6">
                <p className="text-xs font-light leading-relaxed text-muted-foreground">
                  Curated luxury for the modern woman.
                </p>
                <div className="flex flex-col gap-2">
                  {user ? (
                    <Link
                      href="/account"
                      onClick={closeMobileMenu}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium tracking-wide transition hover:border-primary/30 hover:text-primary"
                    >
                      <User className="h-4 w-4" />
                      My Account
                    </Link>
                  ) : (
                    <Link
                      href="/sign-in"
                      onClick={closeMobileMenu}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium tracking-wide text-primary-foreground transition hover:bg-primary/90"
                    >
                      Sign In
                    </Link>
                  )}
                  <Link
                    href="/shop"
                    onClick={closeMobileMenu}
                    className="inline-flex items-center justify-center rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-medium tracking-wide text-foreground transition hover:bg-accent/20"
                  >
                    Explore Collection
                  </Link>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
