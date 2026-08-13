'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PackageCoverDisplay } from '@/components/packages/package-cover-display';
import { Package as PackageType } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { getPackageCoverImages, resolvePackageSavings } from '@/lib/package-utils';
import { getPackageCategoryDiscoveryLabel } from '@/lib/package-catalog';
import { cn } from '@/lib/utils';
import { useServices } from '@/lib/services-context';

interface PackageHeroCarouselProps {
  packages: PackageType[];
  products: Product[];
  retailPrices: Record<string, number>;
  onShopPackages: () => void;
  onFindPerfect: () => void;
}

export function PackageHeroCarousel({
  packages,
  products,
  retailPrices,
  onShopPackages,
  onFindPerfect,
}: PackageHeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const { activeListings } = useServices();

  const slide = packages[index];

  const next = useCallback(() => {
    if (packages.length === 0) return;
    setIndex((i) => (i + 1) % packages.length);
  }, [packages.length]);

  const prev = useCallback(() => {
    if (packages.length === 0) return;
    setIndex((i) => (i - 1 + packages.length) % packages.length);
  }, [packages.length]);

  useEffect(() => {
    if (paused || packages.length <= 1) return;
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [paused, packages.length, next]);

  if (!slide) {
    return (
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.12] via-background to-accent/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            The Atelier
          </p>
          <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-brand)] text-4xl font-medium tracking-tight sm:text-5xl">
            Beauty packages &amp; women&apos;s bundles in Uganda
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Curated beauty packages, gifts, and product-plus-service collections — assembled so you save versus buying separately.
          </p>
        </div>
      </section>
    );
  }

  const savings = resolvePackageSavings(slide, retailPrices);
  const coverImages = getPackageCoverImages(slide, products, activeListings);

  return (
    <section
      className="relative overflow-hidden border-b border-border/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.74_0.12_62_/_0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_oklch(0.40_0.13_340_/_0.12),_transparent_50%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="relative order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {getPackageCategoryDiscoveryLabel(slide.category)}
                </p>
                <h1 className="font-[family-name:var(--font-brand)] text-[2.15rem] font-medium leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.35rem]">
                  Beauty packages,
                  <span className="block text-primary">curated for her</span>
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {slide.tagline || slide.description}
                </p>

                <div className="mt-7 flex flex-wrap items-end gap-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Featured · {slide.name}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-primary">
                      {formatUGX(savings.packagePrice)}
                    </p>
                    {savings.savingsAmount > 0 && (
                      <p className="mt-0.5 text-sm text-accent">
                        Save {formatUGX(savings.savingsAmount)} · {savings.savingsPercentage.toFixed(0)}% vs buying separately
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg" className="h-12 rounded-full px-7 shadow-lg shadow-primary/20" onClick={onShopPackages}>
                    Explore collections
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full px-7"
                    onClick={onFindPerfect}
                  >
                    Find my bundle
                  </Button>
                  <Link href={`/packages/${slide.id}`} className="inline-flex">
                    <Button variant="ghost" className="h-12 rounded-full px-4 text-muted-foreground">
                      View featured
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {packages.length > 1 && (
              <div className="mt-10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={prev}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/80 shadow-sm backdrop-blur-sm transition hover:border-primary/40"
                  aria-label="Previous featured collection"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-2">
                  {packages.map((pkg, i) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === index ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-primary/40'
                      )}
                      aria-label={`Show ${pkg.name}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={next}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/80 shadow-sm backdrop-blur-sm transition hover:border-primary/40"
                  aria-label="Next featured collection"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-2xl" />
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-white/40 shadow-[0_30px_80px_-28px_rgba(80,20,50,0.45)] ring-1 ring-black/5 sm:aspect-[5/6]"
              >
                <PackageCoverDisplay
                  images={coverImages}
                  alt={slide.name}
                  sizes="(max-width:1024px) 100vw, 46vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    Featured collection
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-brand)] text-2xl font-medium text-white">
                    {slide.name}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
