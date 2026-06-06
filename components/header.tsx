'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { ShoppingBag, User, Menu, X, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from './search-bar';
import { BrandLogo } from './brand-logo';
import { cn } from '@/lib/utils';

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
          'flex items-center justify-between py-4 border-b border-border/40 transition-colors',
          isActive ? 'text-primary' : 'text-foreground/85 hover:text-primary'
        )}
      >
        <span className="text-sm font-medium tracking-wide">{label}</span>
        <ChevronRight
          className={cn(
            'h-4 w-4 transition-transform',
            isActive ? 'text-accent' : 'text-muted-foreground/60 group-hover:translate-x-0.5'
          )}
        />
      </Link>
    </motion.div>
  );
}

export function Header() {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
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
              {user ? (
                <Link
                  href="/account"
                  className="hidden rounded-full p-2.5 text-foreground/80 transition hover:bg-secondary hover:text-primary sm:inline-flex"
                  aria-label="Account"
                >
                  <User className="h-5 w-5" />
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  className="hidden text-sm font-medium tracking-wide text-foreground/80 transition hover:text-primary sm:inline-flex"
                >
                  Sign In
                </Link>
              )}

              <Link
                href="/cart"
                className="relative rounded-full p-2.5 text-foreground/80 transition hover:bg-secondary hover:text-primary"
                aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="inline-flex rounded-full p-2.5 text-foreground/80 transition hover:bg-secondary hover:text-primary md:hidden"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tablet nav — compact row below bar */}
        <nav className="hidden border-t border-border/40 md:flex lg:hidden">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-6 overflow-x-auto px-4 py-2.5 scrollbar-hide">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} className="whitespace-nowrap text-xs" />
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile luxury drawer */}
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
                  className="rounded-full p-2 text-foreground/70 transition hover:bg-secondary hover:text-primary"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-border/40 px-5 py-5">
                <p className="mb-3 text-sm font-medium text-muted-foreground">Search</p>
                <SearchBar />
              </div>

              <nav className="flex-1 overflow-y-auto px-5 py-2">
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
