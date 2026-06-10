'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Package, Timer, Sparkles } from 'lucide-react';
import { ProductImage } from '@/components/product-image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/lib/products-context';
import { PackageSpotlightSection } from '@/components/packages/package-spotlight-section';
import { HomeProductCard, ProductCardSkeleton } from '@/components/home/home-product-card';
import {
  ProductSection,
  ProductCarousel,
  CarouselItem,
  CategoryShowcase,
  SocialProofBanner,
} from '@/components/home/product-sections';
import { QuickViewModal } from '@/components/home/quick-view-modal';
import {
  CATEGORY_GROUPS,
  getTrending,
  getNewArrivals,
  getBestSellers,
  getFlashDeals,
  getUnderPrice,
  getLuxuryCollection,
  getLimitedStock,
  getWholesaleProducts,
  getStaffPicks,
  getByCategories,
  getRecommended,
  getCompleteTheLook,
  getFrequentlyBoughtTogether,
  getRecentlyViewed,
  getMostWishlisted,
  getStoredWishlist,
  getStoredRecentlyViewed,
} from '@/lib/home-merchandising';
import { Product } from '@/lib/types/database';
import { HeroMarketingSlot } from '@/components/home/hero-marketing-slot';

export function HomePage() {
  const { products, loading } = useProducts();
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
      bestSellers: getBestSellers(products, 8),
      under50k: getUnderPrice(products, 500000, 8),
      luxury: getLuxuryCollection(products, 500000, 6),
      limited: getLimitedStock(products, 15, 6),
      wholesale: getWholesaleProducts(products, 6),
      staffPicks: getStaffPicks(products, 4),
      recommended: getRecommended(products, viewedIds, 8),
      completeLook: getCompleteTheLook(products, 4),
      boughtTogether: getFrequentlyBoughtTogether(products, 3),
      recentlyViewed: getRecentlyViewed(products, viewedIds),
      wishlisted: getMostWishlisted(products, wishlistIds, 6),
      buyingNow: getBestSellers(products, 6),
    };
  }, [products, viewedIds, wishlistIds]);

  const renderGrid = (
    items: Product[],
    cols = 'grid-cols-2 md:grid-cols-4',
    variant: 'default' | 'compact' | 'editorial' = 'default'
  ) => (
    <div className={`grid ${cols} gap-4 md:gap-5`}>
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <>
      <Header />
      <main className="overflow-x-clip mobile-scroll-optimize">

      {/* Hero — products above the fold */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="pointer-events-none absolute top-20 right-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl max-md:hidden" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 md:pb-12 md:pt-10 lg:px-8">
          <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="order-1 grid grid-cols-2 gap-2.5 sm:gap-3 lg:order-2"
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

      {/* Trending */}
      <ProductSection title="Trending" urgency="Hot" href="/shop">
        {loading ? renderSkeletons(4) : renderCarousel(sections!.trending, 'default')}
      </ProductSection>

      {/* Category showcases with products */}
      {!loading &&
        sections &&
        CATEGORY_GROUPS.map((group) => {
          const groupProducts = getByCategories(products, group.categories, 4);
          if (groupProducts.length === 0) return null;
          return (
            <CategoryShowcase
              key={group.slug}
              title={group.title}
              href={group.href}
            >
              {renderGrid(groupProducts)}
            </CategoryShowcase>
          );
        })}

      {/* Customers buying now */}
      {!loading && sections && (
        <ProductSection title="" className="pt-0">
          <SocialProofBanner message="Live">
            {renderCarousel(sections.buyingNow)}
          </SocialProofBanner>
        </ProductSection>
      )}

      {/* New Arrivals — editorial masonry */}
      <ProductSection title="New" href="/shop">
        {loading ? (
          renderSkeletons(4)
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {sections!.newArrivals.slice(0, 4).map((product, i) => (
              <div key={product.id} className={i === 0 ? 'md:col-span-2 md:row-span-2' : ''}>
                <HomeProductCard
                  product={product}
                  variant={i === 0 ? 'editorial' : 'default'}
                  index={i}
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

      {/* Best Sellers */}
      <ProductSection title="Favorites" href="/shop">
        {loading ? renderSkeletons(4) : renderGrid(sections!.bestSellers)}
      </ProductSection>

      <PackageSpotlightSection context="home" />

      {/* Staff Picks */}
      {!loading && sections && (
        <ProductSection title="Staff Picks" className="bg-secondary/30">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-1">
              {sections.staffPicks[0] && (
                <HomeProductCard
                  product={sections.staffPicks[0]}
                  variant="editorial"
                  badges={['trending']}
                  onQuickView={setQuickViewProduct}
                  wishlistIds={wishlistIds}
                  onWishlistChange={setWishlistIds}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {sections.staffPicks.slice(1, 5).map((product, i) => (
                <HomeProductCard
                  key={product.id}
                  product={product}
                  variant="compact"
                  index={i}
                  onQuickView={setQuickViewProduct}
                  wishlistIds={wishlistIds}
                  onWishlistChange={setWishlistIds}
                />
              ))}
            </div>
          </div>
        </ProductSection>
      )}

      {/* Limited Stock */}
      {!loading && sections && sections.limited.length > 0 && (
        <ProductSection title="Limited" urgency="Low stock" href="/shop">
          {renderCarousel(sections.limited)}
        </ProductSection>
      )}

      {/* Frequently Bought Together */}
      {!loading && sections && sections.boughtTogether.length >= 2 && (
        <ProductSection title="Pairs well with">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {sections.boughtTogether.map((product, i) => (
              <div key={product.id} className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                {i > 0 && <span className="hidden md:block text-2xl text-muted-foreground">+</span>}
                <div className="flex-1 md:w-48">
                  <HomeProductCard
                    product={product}
                    variant="compact"
                    index={i}
                    onQuickView={setQuickViewProduct}
                    wishlistIds={wishlistIds}
                    onWishlistChange={setWishlistIds}
                  />
                </div>
              </div>
            ))}
          </div>
        </ProductSection>
      )}

      {/* Luxury Collection */}
      {!loading && sections && sections.luxury.length > 0 && (
        <ProductSection title="Luxury" href="/shop">
          {renderCarousel(sections.luxury, 'default')}
        </ProductSection>
      )}

      {/* Complete the Look */}
      {!loading && sections && (
        <ProductSection title="Complete the look" className="bg-secondary/20">
          {renderGrid(sections.completeLook, 'grid-cols-2 md:grid-cols-4')}
        </ProductSection>
      )}

      {/* Personalized: Recommended */}
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

      {/* Most Wishlisted */}
      {!loading && sections && (
        <ProductSection title="Wishlisted" href="/shop">
          {renderGrid(sections.wishlisted, 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6', 'compact')}
        </ProductSection>
      )}

      {/* Bottom CTA with product strip */}
      <section className="bg-primary py-10 text-primary-foreground md:py-14">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
          {!loading && sections && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {sections.trending.slice(0, 3).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="relative aspect-square overflow-hidden rounded-xl border border-primary-foreground/20 shadow-lg transition hover:opacity-90"
                >
                  <ProductImage product={product} className="absolute inset-0" sizes="120px" />
                </Link>
              ))}
            </div>
          )}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-light tracking-tight md:text-3xl">Join SheQueen</h2>
            <Link href="/sign-up" className="mt-4 inline-block">
              <Button size="lg" variant="secondary" className="gap-2">
                Sign up
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-5">
        <div className="mx-auto flex max-w-7xl justify-center gap-8 px-4 text-muted-foreground md:gap-14">
          <span className="flex items-center gap-1.5 text-xs" title="Fast delivery">
            <Timer className="h-4 w-4 text-primary" />
            <span className="sr-only">Fast delivery</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs" title="Secure packaging">
            <Package className="h-4 w-4 text-primary" />
            <span className="sr-only">Secure packaging</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs" title="Authentic products">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="sr-only">Authentic</span>
          </span>
        </div>
      </section>

      <Footer />
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </main>
    </>
  );
}
