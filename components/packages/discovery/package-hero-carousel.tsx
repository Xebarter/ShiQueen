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
import { SharePackageButton } from '@/components/shared/share-button';
import { cn } from '@/lib/utils';

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
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [paused, packages.length, next]);

  if (!slide) {
    return (
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-light tracking-tight sm:text-5xl">
            Curated bundles for <span className="font-semibold text-primary">every moment</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Complete solutions — not individual products. Discover packages crafted for your
            lifestyle.
          </p>
        </div>
      </section>
    );
  }

  const savings = resolvePackageSavings(slide, retailPrices);
  const coverImages = getPackageCoverImages(slide, products);

  return (
    <section
      className="relative overflow-hidden border-b border-border/50"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B2850]/20 via-background to-[#FAF5F4]" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.45 }}
              >
                <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {getPackageCategoryDiscoveryLabel(slide.category)}
                </span>
                <h1 className="text-3xl font-light leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {slide.tagline || slide.name}
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {slide.description}
                </p>

                <div className="mt-6 inline-flex flex-col gap-1 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
                  {savings.savingsAmount > 0 && (
                    <p className="text-sm text-muted-foreground line-through">
                      Value {formatUGX(savings.retailTotal)}
                    </p>
                  )}
                  <p className="text-2xl font-bold tabular-nums text-primary">
                    {formatUGX(savings.packagePrice)}
                  </p>
                  {savings.savingsAmount > 0 && (
                    <p className="text-sm font-semibold text-accent">
                      You save {formatUGX(savings.savingsAmount)} (
                      {savings.savingsPercentage.toFixed(0)}%)
                    </p>
                  )}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg" className="h-12 rounded-xl px-6" onClick={onShopPackages}>
                    Shop packages
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-xl px-6"
                    onClick={onFindPerfect}
                  >
                    Find your perfect package
                  </Button>
                  <Link href={`/packages/${slide.id}`}>
                    <Button variant="ghost" className="h-12 rounded-xl">
                      View this bundle
                    </Button>
                  </Link>
                  <SharePackageButton pkg={slide} variant="button" size="lg" className="h-12 rounded-xl" />
                </div>
              </motion.div>
            </AnimatePresence>

            {packages.length > 1 && (
              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={prev}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-sm"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-2">
                  {packages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={cn(
                        'h-2 rounded-full transition-all',
                        i === index ? 'w-6 bg-primary' : 'w-2 bg-border'
                      )}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={next}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-sm"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="relative order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.5 }}
                className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border/50 shadow-2xl"
              >
                <PackageCoverDisplay
                  images={coverImages}
                  alt={slide.name}
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-lg font-semibold text-white drop-shadow-md">{slide.name}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
