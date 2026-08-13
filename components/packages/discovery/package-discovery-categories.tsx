'use client';

import { Package as PackageType } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { PACKAGE_CATEGORIES, type PackageCategoryId } from '@/lib/package-catalog';
import { getPackageCoverImages } from '@/lib/package-utils';
import { PackageCategoryIcon } from '@/components/packages/package-category-icon';
import { isRemoteProductImage } from '@/components/product-image';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useServices } from '@/lib/services-context';
import { cn } from '@/lib/utils';

interface PackageDiscoveryCategoriesProps {
  packages: PackageType[];
  products: Product[];
  selectedCategory?: PackageCategoryId | 'all';
  onSelectCategory: (categoryId: PackageCategoryId) => void;
}

export function PackageDiscoveryCategories({
  packages,
  products,
  selectedCategory = 'all',
  onSelectCategory,
}: PackageDiscoveryCategoriesProps) {
  const { activeListings } = useServices();
  const categoriesWithPackages = PACKAGE_CATEGORIES.map((cat) => ({
    ...cat,
    count: packages.filter((p) => p.category === cat.id).length,
  })).filter((cat) => cat.count > 0);

  if (categoriesWithPackages.length === 0) return null;

  const featured = [...categoriesWithPackages].sort((a, b) => b.count - a.count).slice(0, 4);

  return (
    <section className="border-b border-border/40 py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Worlds</p>
            <h2 className="mt-1 font-[family-name:var(--font-brand)] text-3xl font-medium tracking-tight">
              Shop by ritual
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Every collection is a complete edit — not a handful of leftover SKUs.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {featured.map((cat, i) => {
            const firstPkg = packages.find((p) => p.category === cat.id);
            const cover = firstPkg
              ? getPackageCoverImages(firstPkg, products, activeListings)[0]
              : undefined;

            return (
              <motion.button
                key={cat.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelectCategory(cat.id)}
                className="group relative aspect-[5/6] overflow-hidden rounded-3xl border border-border/50 text-left shadow-sm ring-1 ring-black/[0.03] transition duration-500 hover:-translate-y-1 hover:shadow-xl"
              >
                {cover && isRemoteProductImage(cover) ? (
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes="(max-width:640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/10 to-accent/15" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-md">
                    <PackageCategoryIcon categoryId={cat.id} />
                  </span>
                  <p className="font-[family-name:var(--font-brand)] text-lg font-medium text-white">
                    {cat.discoveryLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-white/75">
                    {cat.count} collection{cat.count === 1 ? '' : 's'}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categoriesWithPackages.map((cat) => {
            const selected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border/70 bg-card text-foreground hover:border-primary/35 hover:bg-primary/[0.04]'
                )}
              >
                <PackageCategoryIcon categoryId={cat.id} className="h-3.5 w-3.5" />
                {cat.discoveryLabel}
                <span className={cn('text-xs tabular-nums', selected ? 'opacity-80' : 'text-muted-foreground')}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
