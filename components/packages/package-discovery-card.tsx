'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, ShoppingBag, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Package as PackageType } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { PackageCoverDisplay } from '@/components/packages/package-cover-display';
import {
  getPackageCoverImages,
  resolvePackageSavings,
} from '@/lib/package-utils';
import {
  getPackageCategoryDiscoveryLabel,
  getPackageTierLabel,
} from '@/lib/package-catalog';
import {
  getPackageItemCount,
  getPackageSocialBadge,
  type PackageSocialBadgeInfo,
} from '@/lib/package-merchandising';
import { SharePackageButton } from '@/components/shared/share-button';
import { cn } from '@/lib/utils';

interface PackageDiscoveryCardProps {
  pkg: PackageType;
  products: Product[];
  retailPrices: Record<string, number>;
  index?: number;
  variant?: 'default' | 'compact' | 'editorial';
  badge?: PackageSocialBadgeInfo | null;
  onQuickView?: (pkg: PackageType) => void;
  onAddToCart: (pkg: PackageType, e: React.MouseEvent) => void;
  hideOriginalPrice?: boolean;
  /** Less copy for home / shop spotlight rows */
  minimal?: boolean;
}

export function PackageDiscoveryCard({
  pkg,
  products,
  retailPrices,
  index = 0,
  variant = 'default',
  badge: badgeOverride,
  onQuickView,
  onAddToCart,
  hideOriginalPrice = false,
  minimal = false,
}: PackageDiscoveryCardProps) {
  const router = useRouter();
  const coverImages = getPackageCoverImages(pkg, products);
  const { retailTotal, packagePrice, savingsAmount, savingsPercentage } =
    resolvePackageSavings(pkg, retailPrices);
  const itemCount = getPackageItemCount(pkg);
  const badge = badgeOverride ?? getPackageSocialBadge(pkg);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(pkg, e);
    router.push('/checkout');
  };

  const isCompact = variant === 'compact';
  const isEditorial = variant === 'editorial';
  const stripOriginalPrice = hideOriginalPrice || minimal;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.05, 0.2), duration: 0.4 }}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl',
        isEditorial && 'rounded-3xl'
      )}
    >
      <div className="relative overflow-hidden">
        <Link
          href={`/packages/${pkg.id}`}
          className={cn(
            'relative block overflow-hidden bg-muted',
            isCompact ? 'aspect-[4/5]' : 'aspect-[4/5] sm:aspect-[3/4]'
          )}
        >
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
            <PackageCoverDisplay
              images={coverImages}
              alt={pkg.name}
              sizes="(max-width:640px) 50vw, 33vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-background/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm backdrop-blur-sm">
              {getPackageCategoryDiscoveryLabel(pkg.category)}
            </span>
            {badge && !minimal && (
              <span className="rounded-full bg-primary/90 px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
                {badge.label}
              </span>
            )}
          </div>

          {savingsAmount > 0 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-accent-foreground shadow-md sm:px-3 sm:py-1 sm:text-xs">
              −{savingsPercentage.toFixed(0)}%
            </span>
          )}
        </Link>

        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <SharePackageButton pkg={pkg} />
          {onQuickView && !minimal && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(pkg);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-background/90 text-foreground shadow-md backdrop-blur-sm"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className={cn('flex flex-1 flex-col', isCompact ? 'p-3.5' : 'p-4 sm:p-5')}>
        <Link href={`/packages/${pkg.id}`} className="min-w-0 flex-1">
          <h3
            className={cn(
              'line-clamp-2 font-semibold leading-snug tracking-tight',
              isCompact ? 'text-sm' : 'text-base sm:text-lg'
            )}
          >
            {pkg.name}
          </h3>
          {!minimal && pkg.tagline && (
            <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground/75 sm:text-sm">
              {pkg.tagline}
            </p>
          )}

          {minimal ? (
            <p className="mt-2 text-base font-bold tabular-nums text-primary">
              {formatUGX(packagePrice)}
            </p>
          ) : (
            <div className="mt-3 space-y-1 rounded-xl bg-secondary/40 p-3">
              {savingsAmount > 0 && !stripOriginalPrice && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Value</span>
                  <span className="line-through tabular-nums">{formatUGX(retailTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="font-medium">Package price</span>
                <span className="font-bold tabular-nums text-primary">
                  {formatUGX(packagePrice)}
                </span>
              </div>
              {savingsAmount > 0 && (
                <div className="flex justify-between text-xs font-semibold text-accent">
                  <span>You save</span>
                  <span className="tabular-nums">
                    {formatUGX(savingsAmount)} ({savingsPercentage.toFixed(0)}%)
                  </span>
                </div>
              )}
            </div>
          )}

          {!minimal && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                Complete bundle · {itemCount} pieces
              </span>
              {pkg.tier && (
                <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                  {getPackageTierLabel(pkg.tier)}
                </span>
              )}
            </div>
          )}
        </Link>

        <div
          className={cn(
            'mt-3 grid gap-2',
            minimal ? 'grid-cols-1' : isCompact ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'
          )}
        >
          {onQuickView && !isCompact && !minimal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden h-10 gap-1.5 rounded-xl sm:inline-flex"
              onClick={(e) => {
                e.preventDefault();
                onQuickView(pkg);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              Quick view
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5 rounded-xl font-semibold sm:h-10"
            onClick={(e) => onAddToCart(pkg, e)}
            aria-label={`Add ${pkg.name} to cart`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {minimal ? 'Add' : 'Add to cart'}
          </Button>
          {!minimal && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={cn(
                'h-10 gap-1.5 rounded-xl font-semibold',
                isCompact ? 'col-span-1' : 'sm:col-span-1'
              )}
              onClick={handleBuyNow}
            >
              <Zap className="h-3.5 w-3.5" />
              Buy now
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function PackageDiscoveryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="aspect-[4/5] animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
