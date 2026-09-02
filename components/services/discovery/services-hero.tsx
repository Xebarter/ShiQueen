'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HeroMarketingSlot } from '@/components/home/hero-marketing-slot';
import { ServiceCard } from '@/components/services/service-card';
import { getProviderById } from '@/lib/services-utils';
import type { ServiceListing, ServiceProvider } from '@/lib/types/services';
import { BRAND_NAME } from '@/lib/brand';
import { useFeature } from '@/lib/feature-flags-context';

interface ServicesHeroProps {
  listings: ServiceListing[];
  providers: ServiceProvider[];
  loading?: boolean;
  onBook: (listing: ServiceListing) => void;
}

function HeroCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card animate-pulse">
      <div className="aspect-[16/10] bg-muted" />
      <div className="space-y-2 p-3.5">
        <div className="h-3.5 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}

export function ServicesHero({ listings, providers, loading, onBook }: ServicesHeroProps) {
  const packagesEnabled = useFeature('packages');
  const mosaic = listings.slice(0, 4);

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="pointer-events-none absolute top-20 right-0 hidden h-96 w-96 rounded-full bg-accent/10 blur-3xl md:block" />
      <div className="relative mx-auto max-w-[90rem] px-3 pt-6 pb-6 sm:px-4 md:pt-10 md:pb-8 lg:px-5">
        <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="order-1 grid grid-cols-2 gap-2 sm:gap-2.5 lg:order-2"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <HeroCardSkeleton key={i} />)
              : mosaic.map((listing, i) => (
                  <ServiceCard
                    key={listing.id}
                    listing={listing}
                    provider={getProviderById(providers, listing.providerId)}
                    variant="compact"
                    index={i}
                    onBook={() => onBook(listing)}
                  />
                ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="order-2 lg:order-1"
          >
            <HeroMarketingSlot
              placement="home-hero"
              fallbackPlacements={['shop-hero']}
              compact
            />
            <h1 className="mt-4 font-[family-name:var(--font-brand)] text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {BRAND_NAME} Services
            </h1>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <a href="#services-browse" className="font-medium text-primary hover:underline">
                Browse
              </a>
              <span aria-hidden>·</span>
              <Link href="/shop" className="hover:text-foreground">
                Shop
              </Link>
              {packagesEnabled ? (
                <>
                  <span aria-hidden>·</span>
                  <Link href="/packages" className="hover:text-foreground">
                    Bundles
                  </Link>
                </>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
