'use client';

import { Package as PackageType } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { PACKAGE_CATEGORIES, type PackageCategoryId } from '@/lib/package-catalog';
import { getPackageCoverImages } from '@/lib/package-utils';
import { PackageCategoryIcon } from '@/components/packages/package-category-icon';
import { isRemoteProductImage } from '@/components/product-image';
import Image from 'next/image';
import { motion } from 'framer-motion';
interface PackageDiscoveryCategoriesProps {
  packages: PackageType[];
  products: Product[];
  onSelectCategory: (categoryId: PackageCategoryId) => void;
}

export function PackageDiscoveryCategories({
  packages,
  products,
  onSelectCategory,
}: PackageDiscoveryCategoriesProps) {
  const categoriesWithPackages = PACKAGE_CATEGORIES.filter((cat) =>
    packages.some((p) => p.category === cat.id)
  );

  if (categoriesWithPackages.length === 0) return null;

  return (
    <section className="border-b border-border/40 bg-muted/10 py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
            Discover by category
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated collections for every need, occasion, and lifestyle
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {categoriesWithPackages.map((cat, i) => {
            const firstPkg = packages.find((p) => p.category === cat.id);
            const cover = firstPkg
              ? getPackageCoverImages(firstPkg, products)[0]
              : undefined;
            const count = packages.filter((p) => p.category === cat.id).length;

            return (
              <motion.button
                key={cat.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelectCategory(cat.id)}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/60 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {isRemoteProductImage(cover) ? (
                  <Image
                    src={cover}
                    alt={cat.discoveryLabel}
                    fill
                    sizes="(max-width:640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-background/20 text-white backdrop-blur-sm">
                    <PackageCategoryIcon categoryId={cat.id} className="h-4 w-4" />
                  </span>
                  <p className="font-semibold text-white">{cat.discoveryLabel}</p>
                  <p className="mt-0.5 text-xs text-white/80">{count} bundles</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
