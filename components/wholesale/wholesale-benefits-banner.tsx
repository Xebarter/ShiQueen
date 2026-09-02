'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { isRemoteProductImage } from '@/components/product-image';
import { getWholesaleUnitPrice } from '@/lib/wholesale-catalog';
import { formatUGX } from '@/lib/wholesale-data';
import type { Product } from '@/lib/types/database';
import { cn } from '@/lib/utils';
import { useFeature } from '@/lib/feature-flags-context';

type WholesaleHeroProps = {
  catalogSize: number;
  featured: Product[];
  loading?: boolean;
  onSelectProduct?: (id: string) => void;
  search?: React.ReactNode;
  className?: string;
};

function HeroTileSkeleton() {
  return <div className="aspect-[4/5] animate-pulse rounded-xl bg-muted/70" />;
}

function HeroTile({
  product,
  index,
  onSelect,
}: {
  product: Product;
  index: number;
  onSelect?: (id: string) => void;
}) {
  const unit = getWholesaleUnitPrice(product, product.minOrderQuantity);
  const image = product.image || product.images?.[0];

  return (
    <button
      type="button"
      onClick={() => onSelect?.(product.id)}
      className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-muted text-left"
    >
      {isRemoteProductImage(image) ? (
        <Image
          src={image}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 45vw, 220px"
          priority={index < 2}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-2xl text-muted-foreground/40">
          ◆
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-2.5 pt-10 sm:p-3">
        <p className="truncate text-xs font-semibold text-white sm:text-sm">{product.name}</p>
        <p className="mt-0.5 text-[11px] font-medium tabular-nums text-white/85 sm:text-xs">
          {formatUGX(unit)}
          <span className="font-normal text-white/65"> · min {product.minOrderQuantity}</span>
        </p>
      </div>
    </button>
  );
}

export function WholesaleHero({
  catalogSize,
  featured,
  loading,
  onSelectProduct,
  search,
  className,
}: WholesaleHeroProps) {
  const packagesEnabled = useFeature('packages');
  const tiles = featured.filter(Boolean).slice(0, 4);

  return (
    <section className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="pointer-events-none absolute top-20 right-0 hidden h-96 w-96 rounded-full bg-accent/10 blur-3xl md:block" />

      <div className="relative mx-auto max-w-[90rem] px-3 pt-6 pb-4 sm:px-4 md:pt-10 md:pb-6 lg:px-5">
        <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="order-1 grid grid-cols-2 gap-2 sm:gap-2.5 lg:order-2"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <HeroTileSkeleton key={i} />)
              : tiles.map((product, i) => (
                  <HeroTile
                    key={product.id}
                    product={product}
                    index={i}
                    onSelect={onSelectProduct}
                  />
                ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="order-2 lg:order-1"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Wholesale
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-brand)] text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Trade pricing for fashion &amp; beauty
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {catalogSize} products · volume rates · free shipping
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {packagesEnabled ? (
                <>
                  <Link href="/packages" className="font-medium text-primary hover:underline">
                    Bundles
                  </Link>
                  <span aria-hidden>·</span>
                </>
              ) : null}
              <Link href="/wholesale/account" className="hover:text-foreground">
                Wholesale account
              </Link>
              <span aria-hidden>·</span>
              <Link href="/shop" className="hover:text-foreground">
                Retail shop
              </Link>
            </div>
            {search ? (
              <div id="wholesale-search" className="mt-5 max-w-md scroll-mt-24">
                {search}
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
