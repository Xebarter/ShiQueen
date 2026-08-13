'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Package, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { ProductImage } from '@/components/product-image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { usePublicProducts } from '@/lib/hooks/use-public-catalog';
import { PackageSpotlightSection } from '@/components/packages/package-spotlight-section';
import { HomeProductCard, ProductCardSkeleton } from '@/components/home/home-product-card';
import {
  ProductSection,
  ProductCarousel,
  CarouselItem,
  CategoryShowcase,
} from '@/components/home/product-sections';
import { QuickViewModal } from '@/components/home/quick-view-modal';
import {
  CATEGORY_GROUPS,
  getTrending,
  getNewArrivals,
  getFlashDeals,
  getUnderPrice,
  getLimitedStock,
  getByCategories,
  getRecommended,
  getRecentlyViewed,
  getStoredWishlist,
  getStoredRecentlyViewed,
} from '@/lib/home-merchandising';
import { Product } from '@/lib/types/database';
import { HeroMarketingSlot } from '@/components/home/hero-marketing-slot';
import { SEO_HOME_TITLE } from '@/lib/seo/site';

export function HomePage() {
  const { products, loading } = usePublicProducts();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    setWishlistIds(getStoredWishlist());
    setViewedIds(getStoredRecentlyViewed());
  }, []);

  const sections = useMemo(() => {
    if (products.length === 0) return null;
    return {
      trending: getTrending(products, 10),
      heroProducts: getTrending(products, 4),
      flashDeals: getFlashDeals(products, 8),
      newArrivals: getNewArrivals(products, 8),
      under50k: getUnderPrice(products, 500000, 8),
      limited: getLimitedStock(products, 15, 6),
      recommended: getRecommended(products, viewedIds, 8),
      recentlyViewed: getRecentlyViewed(products, viewedIds),
    };
  }, [products, viewedIds]);

  const renderGrid = (
    items: Product[],
    cols = 'grid-cols-2 md:grid-cols-4',
    variant: 'default' | 'compact' | 'editorial' = 'default'
  ) => (
    <div className={`grid ${cols} gap-2.5 md:gap-3`}>
      {items.map((product, i) => (
        <HomeProductCard
          key={product.id}
          product={product}
          variant={variant}
          index={i}
          badges={i === 0 ? ['trending'] : undefined}
          onQuickView={setQuickViewProduct}
          wishlistIds={wishlistIds}
          onWishlistChange={setWishlistIds}
        />
      ))}
    </div>
  );

  const renderCarousel = (items: Product[], variant: 'default' | 'compact' = 'compact') => (
    <ProductCarousel>
      {items.map((product, i) => (
        <CarouselItem key={product.id}>
          <HomeProductCard
            product={product}
            variant={variant}
            index={i}
            onQuickView={setQuickViewProduct}
            wishlistIds={wishlistIds}
            onWishlistChange={setWishlistIds}
          />
        </CarouselItem>
      ))}
    </ProductCarousel>
  );

  const renderSkeletons = (count: number) => (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <>
      <Header />
      <main className="overflow-x-clip mobile-scroll-optimize">
        {/* Hero */}
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
                  ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                  : sections?.heroProducts.map((product, i) => (
                      <HomeProductCard
                        key={product.id}
                        product={product}
                        variant={i === 0 ? 'editorial' : 'compact'}
                        index={i}
                        badges={i === 0 ? ['trending'] : undefined}
                        onQuickView={setQuickViewProduct}
                        wishlistIds={wishlistIds}
                        onWishlistChange={setWishlistIds}
                      />
                    ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="order-2 lg:order-1"
              >
                <HeroMarketingSlot placement="home-hero" compact />
                <h1 className="mt-4 font-[family-name:var(--font-brand)] text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                  {SEO_HOME_TITLE}
                </h1>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <Link href="/packages" className="font-medium text-primary hover:underline">
                    Bundles
                  </Link>
                  <span aria-hidden>·</span>
                  <Link href="/shop" className="hover:text-foreground">
                    Shop all
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Flash Deals */}
        {(loading || (sections?.flashDeals.length ?? 0) > 0) && (
          <ProductSection
            title="Flash Deals"
            urgency="Sale"
            href="/shop"
            className="bg-gradient-to-r from-accent/5 to-primary/5"
          >
            {loading ? renderSkeletons(4) : renderCarousel(sections!.flashDeals)}
          </ProductSection>
        )}

        {/* Category showcases */}
        {!loading &&
          sections &&
          CATEGORY_GROUPS.map((group) => {
            const groupProducts = getByCategories(products, group.categories, 4);
            if (groupProducts.length === 0) return null;
            return (
              <CategoryShowcase key={group.slug} title={group.title} href={group.href}>
                {renderGrid(groupProducts)}
              </CategoryShowcase>
            );
          })}

        {/* New Arrivals */}
        <ProductSection title="New" href="/shop">
          {loading ? (
            renderSkeletons(4)
          ) : (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
              {sections!.newArrivals.slice(0, 4).map((product, i) => (
                <div key={product.id} className={i === 0 ? 'md:col-span-2 md:row-span-2' : ''}>
                  <HomeProductCard
                    product={product}
                    variant={i === 0 ? 'editorial' : 'default'}
                    index={i}
                    badges={i === 0 ? ['new'] : undefined}
                    onQuickView={setQuickViewProduct}
                    wishlistIds={wishlistIds}
                    onWishlistChange={setWishlistIds}
                  />
                </div>
              ))}
            </div>
          )}
        </ProductSection>

        {/* Under 500K */}
        {!loading && sections && sections.under50k.length > 0 && (
          <ProductSection title="Under 500K" href="/shop">
            {renderGrid(sections.under50k)}
          </ProductSection>
        )}

        <PackageSpotlightSection context="home" />

        {/* Limited Stock */}
        {!loading && sections && sections.limited.length > 0 && (
          <ProductSection title="Limited" urgency="Low stock" href="/shop">
            {renderCarousel(sections.limited)}
          </ProductSection>
        )}

        {/* Personalized */}
        {!loading && sections && (
          <ProductSection
            title={viewedIds.length > 0 ? 'For you' : 'Picks for you'}
            href="/shop"
          >
            {renderGrid(sections.recommended)}
          </ProductSection>
        )}

        {/* Recently Viewed */}
        {!loading && sections && sections.recentlyViewed.length > 0 && (
          <ProductSection title="Recent">
            {renderCarousel(sections.recentlyViewed)}
          </ProductSection>
        )}

        {/* Visible trust strip */}
        <section className="border-y border-border/60 bg-muted/20 py-5">
          <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-center gap-x-6 gap-y-3 px-3 text-sm text-muted-foreground sm:gap-x-10 sm:px-4 lg:px-5">
            <span className="inline-flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Free delivery
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Secure Paytota
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Verified services
            </span>
            <span className="inline-flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Authentic products
            </span>
          </div>
        </section>

        {/* Closing CTA — shop primary */}
        <section className="bg-primary py-10 text-primary-foreground md:py-12">
          <div className="mx-auto grid max-w-[90rem] items-center gap-6 px-3 sm:px-4 lg:grid-cols-2 lg:gap-10 lg:px-5">
            {!loading && sections && (
              <div className="grid grid-cols-3 gap-2">
                {sections.trending.slice(0, 3).map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="relative aspect-square overflow-hidden rounded-lg border border-primary-foreground/20 shadow-lg transition hover:opacity-90"
                  >
                    <ProductImage product={product} className="absolute inset-0" sizes="120px" />
                  </Link>
                ))}
              </div>
            )}
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-light tracking-tight md:text-3xl">
                Ready to complete your look?
              </h2>
              <p className="mt-2 text-sm opacity-90">
                Browse the full catalog — or create an account to save favorites.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link href="/shop">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Shop all
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Sign up
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      </main>
    </>
  );
}
