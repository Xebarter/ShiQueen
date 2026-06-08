'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Package as PackageType } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { PackageCoverDisplay } from '@/components/packages/package-cover-display';
import {
  getPackageCoverImages,
  getPackageTypeLabel,
  getUniquePackageProductIds,
  resolvePackageSavings,
} from '@/lib/package-utils';
interface PackageCardProps {
  pkg: PackageType;
  productNames: Record<string, string>;
  retailPrices: Record<string, number>;
  products: Product[];
  index?: number;
  onAddToCart: (pkg: PackageType, e: React.MouseEvent) => void;
}

export function PackageCard({
  pkg,
  productNames,
  retailPrices,
  products,
  index = 0,
  onAddToCart,
}: PackageCardProps) {
  const coverImages = getPackageCoverImages(pkg, products);
  const { retailTotal, packagePrice, savingsAmount, savingsPercentage } =
    resolvePackageSavings(pkg, retailPrices);
  const itemCount = pkg.items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueProducts = getUniquePackageProductIds(pkg.items).length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.35 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex min-h-0 flex-1 flex-row sm:flex-col">
        <Link
          href={`/packages/${pkg.id}`}
          className="relative min-h-[7.5rem] w-[36%] max-w-[9.5rem] shrink-0 self-stretch overflow-hidden bg-muted sm:aspect-[4/3] sm:h-auto sm:w-full sm:max-w-none"
        >
          <div className="absolute inset-0">
            <PackageCoverDisplay
              images={coverImages}
              alt={pkg.name}
              sizes="(max-width:640px) 40vw, 33vw"
            />
          </div>
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm backdrop-blur-sm sm:left-3 sm:top-3 sm:text-xs">
            {getPackageTypeLabel(pkg.rule.type)}
          </span>
          {savingsAmount > 0 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground shadow-sm sm:bottom-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-xs">
              −{savingsPercentage.toFixed(0)}%
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-5">
          <Link href={`/packages/${pkg.id}`} className="min-w-0 flex-1">
            <h2 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight sm:text-lg">
              {pkg.name}
            </h2>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:line-clamp-2 sm:text-sm">
              {pkg.description}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:mt-3">
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs">
                <Package className="h-3 w-3" />
                {itemCount} items · {uniqueProducts} products
              </span>
            </div>

            <ul className="mt-2.5 hidden space-y-1 sm:block">
              {pkg.items.slice(0, 3).map((item) => (
                <li key={item.productId} className="truncate text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {productNames[item.productId]}
                  </span>
                  <span> × {item.quantity}</span>
                </li>
              ))}
              {pkg.items.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  +{pkg.items.length - 3} more lines
                </li>
              )}
            </ul>
          </Link>

          <div className="mt-3 border-t border-border/60 pt-3 sm:mt-4">
            {savingsAmount > 0 && (
              <p className="mb-1 text-[10px] text-muted-foreground line-through sm:text-xs">
                {formatUGX(retailTotal)} retail
              </p>
            )}
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                  Package price
                </p>
                <p className="text-base font-bold tabular-nums text-primary sm:text-2xl">
                  {formatUGX(packagePrice)}
                </p>
              </div>
              {savingsAmount > 0 && (
                <p className="text-right text-[10px] font-semibold text-accent sm:text-xs">
                  Save {formatUGX(savingsAmount)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 p-3 pt-0 sm:p-4 sm:pt-0">
        <Button
          onClick={(e) => onAddToCart(pkg, e)}
          className="h-11 w-full gap-2 rounded-xl text-sm font-semibold sm:h-12"
          size="lg"
        >
          Add to cart
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.article>
  );
}

export function PackageCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex flex-row sm:flex-col">
        <div className="aspect-square w-[36%] max-w-[9.5rem] shrink-0 animate-pulse bg-muted sm:w-full sm:max-w-none sm:aspect-[4/3]" />
        <div className="flex flex-1 flex-col gap-3 p-3.5 sm:p-5">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-auto h-6 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="h-11 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
