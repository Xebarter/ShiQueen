'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Boxes,
  ChevronRight,
  Heart,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  User,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { ShopMobileMenuFilters } from '@/components/shop/shop-mobile-menu-filters';
import { useMobileMenuCatalog } from '@/lib/hooks/use-mobile-menu-catalog';
import { useShopFilters } from '@/lib/shop-filters-context';
import { cn } from '@/lib/utils';
import type { MobileMenuDestination } from '@/lib/hooks/use-mobile-menu-catalog';

type MobileDrawerProps = {
  onClose: () => void;
  user: { email?: string | null } | null;
  itemCount: number;
  wishlistCount: number;
};

function MenuImage({
  src,
  alt,
  className,
  icon: Icon = Sparkles,
}: {
  src: string | null;
  alt: string;
  className?: string;
  icon?: typeof Sparkles;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes="160px"
        className={cn('object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-accent/10 to-secondary',
        className
      )}
    >
      <Icon className="h-8 w-8 text-primary/50" strokeWidth={1.25} />
    </div>
  );
}

function DestinationCard({
  destination,
  onClose,
  variant = 'default',
  index,
}: {
  destination: MobileMenuDestination;
  onClose: () => void;
  variant?: 'hero' | 'default' | 'wide';
  index: number;
}) {
  const pathname = usePathname();
  const isActive =
    destination.href === '/shop'
      ? pathname === '/shop' || pathname.startsWith('/products/')
      : pathname === destination.href || pathname.startsWith(`${destination.href}/`);

  const icons: Record<string, typeof Store> = {
    Shop: Store,
    Packages: Boxes,
    Services: Sparkles,
    Wholesale: ShoppingBag,
  };
  const Icon = icons[destination.label] ?? Sparkles;

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 + index * 0.05, duration: 0.35 }}
      >
        <Link
          href={destination.href}
          onClick={onClose}
          className={cn(
            'group relative flex h-28 overflow-hidden rounded-2xl border shadow-sm transition',
            isActive
              ? 'border-primary/40 ring-2 ring-primary/20'
              : 'border-border/60 hover:border-primary/30 hover:shadow-md'
          )}
        >
          <div className="relative h-full w-[42%] shrink-0">
            <MenuImage src={destination.image} alt={destination.label} icon={Icon} />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 bg-gradient-to-r from-background to-secondary/30 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              Explore
            </p>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {destination.label}
            </p>
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {destination.subtitle}
            </p>
          </div>
          <ChevronRight className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.05, duration: 0.35 }}
      className={variant === 'wide' ? 'col-span-2' : undefined}
    >
      <Link
        href={destination.href}
        onClick={onClose}
        className={cn(
          'group relative flex overflow-hidden rounded-xl border bg-card shadow-sm transition',
          variant === 'wide' ? 'h-20' : 'h-24 flex-col',
          isActive
            ? 'border-primary/40 ring-1 ring-primary/20'
            : 'border-border/60 hover:border-primary/30 hover:shadow-md'
        )}
      >
        <div className={cn('relative', variant === 'wide' ? 'h-full w-24 shrink-0' : 'h-[58%] w-full')}>
          <MenuImage src={destination.image} alt={destination.label} icon={Icon} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        </div>
        <div
          className={cn(
            'flex flex-1 flex-col justify-center',
            variant === 'wide' ? 'px-3 py-2' : 'px-2.5 py-2'
          )}
        >
          <p className="text-sm font-semibold tracking-tight text-foreground">{destination.label}</p>
          <p className="line-clamp-1 text-[11px] text-muted-foreground">{destination.subtitle}</p>
        </div>
        {variant === 'wide' && (
          <ChevronRight className="mr-3 h-4 w-4 shrink-0 self-center text-muted-foreground/60 transition group-hover:text-primary" />
        )}
      </Link>
    </motion.div>
  );
}

export const mobileDrawerEase = [0.32, 0.72, 0, 1] as const;

export const mobileDrawerShellClassName =
  'fixed inset-y-0 right-0 z-[70] flex w-[min(21rem,92vw)] flex-col border-l border-border/40 bg-background shadow-[-20px_0_60px_rgba(0,0,0,0.12)] will-change-transform md:hidden';

export function getMobileDrawerTransition(prefersReducedMotion: boolean) {
  return prefersReducedMotion
    ? { duration: 0 }
    : { type: 'tween' as const, duration: 0.38, ease: mobileDrawerEase };
}

export function MobileDrawer({ onClose, user, itemCount, wishlistCount }: MobileDrawerProps) {
  const pathname = usePathname();
  const shopFilters = useShopFilters();
  const showShopMenuFilters = pathname === '/shop' && shopFilters !== null;
  const { shopCategories, serviceCategories, destinations } = useMobileMenuCatalog();

  const [shopDestination, packagesDestination, servicesDestination, wholesaleDestination] =
    destinations;

  const wishlistHref = user ? '/account#wishlist' : '/sign-in';

  return (
    <>
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border/50 px-5 py-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.05]" />
        <div className="relative flex items-center justify-between">
          <BrandLogo variant="header" href="/" onClick={onClose} />
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border/60 bg-background/80 p-2 text-foreground/70 shadow-sm transition hover:border-primary/30 hover:text-primary"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2 border-b border-border/40 px-4 py-4">
          <Link
            href={user ? '/account' : '/sign-in'}
            onClick={onClose}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-secondary/30 px-2 py-3 text-center transition hover:border-primary/30 hover:bg-secondary/50"
          >
            <User className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-medium text-foreground">
              {user ? 'Account' : 'Sign in'}
            </span>
          </Link>
          <Link
            href={wishlistHref}
            onClick={onClose}
            className="relative flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-secondary/30 px-2 py-3 text-center transition hover:border-primary/30 hover:bg-secondary/50"
          >
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-medium text-foreground">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            onClick={onClose}
            className="relative flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-secondary/30 px-2 py-3 text-center transition hover:border-primary/30 hover:bg-secondary/50"
          >
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-medium text-foreground">Cart</span>
            {itemCount > 0 && (
              <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        </div>

        <div className="space-y-6 px-4 py-5">
          {/* Main destinations */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Discover
            </p>
            <div className="space-y-3">
              <DestinationCard
                destination={shopDestination}
                onClose={onClose}
                variant="hero"
                index={0}
              />
              <div className="grid grid-cols-2 gap-2.5">
                <DestinationCard
                  destination={packagesDestination}
                  onClose={onClose}
                  index={1}
                />
                <DestinationCard
                  destination={servicesDestination}
                  onClose={onClose}
                  index={2}
                />
                <DestinationCard
                  destination={wholesaleDestination}
                  onClose={onClose}
                  variant="wide"
                  index={3}
                />
              </div>
            </div>
          </section>

          {/* Category tiles with product images */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Shop by category
            </p>
            <div className="grid grid-cols-3 gap-2">
              {shopCategories.map((cat, index) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.12 + index * 0.03, duration: 0.3 }}
                  >
                    <Link
                      href={cat.href}
                      onClick={onClose}
                      className="group block overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="relative aspect-square w-full">
                        <MenuImage
                          src={cat.image}
                          alt={cat.productName ?? cat.label}
                          icon={Store}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                        <span className="absolute bottom-1.5 left-0 right-0 px-1.5 text-center text-[10px] font-semibold leading-tight text-white drop-shadow-sm">
                          {cat.label}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
              ))}
            </div>
          </section>

          {serviceCategories.length > 0 && (
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Services by category
              </p>
              <div className="grid grid-cols-3 gap-2">
                {serviceCategories.map((cat, index) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.18 + index * 0.03, duration: 0.3 }}
                  >
                    <Link
                      href={cat.href}
                      onClick={onClose}
                      className="group block overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="relative aspect-square w-full">
                        <MenuImage
                          src={cat.image}
                          alt={cat.productName ?? cat.label}
                          icon={Sparkles}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                        <span className="absolute bottom-1.5 left-0 right-0 px-1.5 text-center text-[10px] font-semibold leading-tight text-white drop-shadow-sm">
                          {cat.label}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {showShopMenuFilters && (
            <section className="-mx-4 overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
              <ShopMobileMenuFilters onClose={onClose} embedded />
            </section>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 bg-gradient-to-t from-secondary/40 to-background px-4 py-5">
        <p className="mb-3 text-center text-xs leading-relaxed text-muted-foreground">
          Curated luxury for the modern woman.
        </p>
        <Link href="/shop" onClick={onClose} className="block">
          <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold tracking-wide text-primary-foreground shadow-md transition hover:bg-primary/90">
            Explore Collection
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </>
  );
}
