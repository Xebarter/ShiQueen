'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package as PackageType } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { PackageCoverDisplay } from '@/components/packages/package-cover-display';
import { formatUGX } from '@/lib/wholesale-data';
import {
  getPackageCoverImages,
  resolvePackageSavings,
} from '@/lib/package-utils';
import { getPackageTierLabel } from '@/lib/package-catalog';
import { getPackageItemCount } from '@/lib/package-merchandising';
import { cn } from '@/lib/utils';

interface PackageCompareStripProps {
  packages: PackageType[];
  products: Product[];
  retailPrices: Record<string, number>;
  onAddToCart: (pkg: PackageType, e: React.MouseEvent) => void;
}

export function PackageCompareStrip({
  packages,
  products,
  retailPrices,
  onAddToCart,
}: PackageCompareStripProps) {
  const router = useRouter();
  const compareSet = packages.slice(0, 3);
  if (compareSet.length < 2) return null;

  const savingsList = compareSet.map((p) => resolvePackageSavings(p, retailPrices));
  const bestValueIndex = savingsList.reduce(
    (best, s, i) => (s.savingsPercentage > savingsList[best].savingsPercentage ? i : best),
    0
  );

  return (
    <section className="border-y border-border/40 bg-muted/15 py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
            Compare & upgrade
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            See the value difference — higher tiers include more for less per piece
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {compareSet.map((pkg, index) => {
            const savings = savingsList[index];
            const isBest = index === bestValueIndex;
            const coverImages = getPackageCoverImages(pkg, products);
            const pieces = getPackageItemCount(pkg);

            return (
              <div
                key={pkg.id}
                className={cn(
                  'flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm',
                  isBest ? 'border-primary ring-2 ring-primary/20' : 'border-border/70'
                )}
              >
                {isBest && (
                  <div className="bg-primary px-3 py-1.5 text-center text-xs font-semibold text-primary-foreground">
                    Best value
                  </div>
                )}
                <div className="relative aspect-[4/3] bg-muted">
                  <PackageCoverDisplay images={coverImages} alt={pkg.name} sizes="33vw" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold leading-snug">{pkg.name}</h3>
                  {pkg.tier && (
                    <p className="mt-1 text-xs font-medium text-accent">
                      {getPackageTierLabel(pkg.tier)}
                    </p>
                  )}
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Pieces</dt>
                      <dd className="font-medium">{pieces}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Total value</dt>
                      <dd className="line-through">{formatUGX(savings.retailTotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Package price</dt>
                      <dd className="font-bold text-primary">
                        {formatUGX(savings.packagePrice)}
                      </dd>
                    </div>
                    <div className="flex justify-between font-semibold text-accent">
                      <dt>You save</dt>
                      <dd>{formatUGX(savings.savingsAmount)}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto grid gap-2 pt-4">
                    <Button
                      className="h-10 rounded-xl"
                      onClick={(e) => onAddToCart(pkg, e)}
                    >
                      Add to cart
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl"
                      onClick={() => router.push(`/packages/${pkg.id}`)}
                    >
                      View bundle
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
