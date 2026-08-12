'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Package as PackageType } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { PackageCoverDisplay } from '@/components/packages/package-cover-display';
import {
  getPackageCoverImages,
  getPackageItemName,
  resolvePackageSavings,
} from '@/lib/package-utils';
import { getDefaultHighlights } from '@/lib/package-catalog';
import { getPackageItemCount } from '@/lib/package-merchandising';
import { SharePackageButton } from '@/components/shared/share-button';
import toast from 'react-hot-toast';
import { useHistoryOverlay } from '@/lib/hooks/use-history-overlay';
import { useServices } from '@/lib/services-context';

interface PackageQuickViewModalProps {
  pkg: PackageType | null;
  products: Product[];
  productNames: Record<string, string>;
  retailPrices: Record<string, number>;
  onClose: () => void;
  onAddToCart: (pkg: PackageType) => void;
}

export function PackageQuickViewModal({
  pkg,
  products,
  productNames,
  retailPrices,
  onClose,
  onAddToCart,
}: PackageQuickViewModalProps) {
  const router = useRouter();
  const { activeListings } = useServices();

  useHistoryOverlay(Boolean(pkg), onClose);

  if (!pkg) return null;

  const coverImages = getPackageCoverImages(pkg, products, activeListings);
  const savings = resolvePackageSavings(pkg, retailPrices);
  const highlights =
    pkg.highlights && pkg.highlights.length > 0
      ? pkg.highlights
      : getDefaultHighlights(pkg.category);
  const itemCount = getPackageItemCount(pkg);

  const handleAdd = () => {
    onAddToCart(pkg);
    toast.success('Added to cart');
    onClose();
  };

  const handleBuyNow = () => {
    onAddToCart(pkg);
    onClose();
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {pkg && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] z-[70] max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl md:inset-x-auto md:left-1/2 md:w-full md:max-w-2xl md:-translate-x-1/2"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-md"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
              <PackageCoverDisplay images={coverImages} alt={pkg.name} sizes="672px" />
            </div>

            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold pr-8">{pkg.name}</h2>
              {pkg.tagline && (
                <p className="mt-1 text-sm font-medium text-foreground/80">{pkg.tagline}</p>
              )}

              <div className="mt-4 space-y-1 rounded-xl bg-secondary/40 p-4">
                {savings.savingsAmount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Value</span>
                    <span className="line-through">{formatUGX(savings.retailTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Package price</span>
                  <span className="text-lg font-bold text-primary">
                    {formatUGX(savings.packagePrice)}
                  </span>
                </div>
                {savings.savingsAmount > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-accent">
                    <span>You save</span>
                    <span>
                      {formatUGX(savings.savingsAmount)} ({savings.savingsPercentage.toFixed(0)}%)
                    </span>
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Complete bundle · {itemCount} pieces included
              </p>

              <ul className="mt-4 space-y-2 text-sm">
                {highlights.slice(0, 3).map((h, i) => (
                  <li key={i} className="text-muted-foreground">
                    ✓ {h}
                  </li>
                ))}
              </ul>

              <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                {pkg.items.slice(0, 4).map((item, i) => (
                  <li key={i} className="truncate text-muted-foreground">
                    {getPackageItemName(item, productNames)} × {item.quantity}
                  </li>
                ))}
                {pkg.items.length > 4 && (
                  <li className="text-muted-foreground">+{pkg.items.length - 4} more</li>
                )}
              </ul>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <Button className="h-11 gap-2 rounded-xl" onClick={handleAdd}>
                  <ShoppingBag className="h-4 w-4" />
                  Add to cart
                </Button>
                <Button
                  variant="secondary"
                  className="h-11 gap-2 rounded-xl"
                  onClick={handleBuyNow}
                >
                  <Zap className="h-4 w-4" />
                  Buy now
                </Button>
              </div>

              <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <SharePackageButton pkg={pkg} variant="button" size="default" />
                <Link
                  href={`/packages/${pkg.id}`}
                  className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
                  onClick={onClose}
                >
                  View full details
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
