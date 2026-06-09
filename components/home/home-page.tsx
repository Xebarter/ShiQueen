'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, Package, Timer } from 'lucide-react';
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

const CATEGORY_GRADIENTS = [
  'bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950/30 dark:to-pink-950/20',
  'bg-gradient-to-br from-fuchsia-50 to-rose-100 dark:from-fuchsia-950/30 dark:to-rose-950/20',
  'bg-gradient-to-br from-amber-50 to-rose-100 dark:from-amber-950/25 dark:to-rose-950/20',
];

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
      <main className="overflow-x-hidden">

      {/* Hero — products above the fold */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:pt-12 md:pb-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <HeroMarketingSlot placement="home-hero" />
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span>{products.length}+ Products</span>
                <span>Free shipping over USh 500K</span>
                <span>18% VAT included</span>
                <Link
                  href="/packages"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Package className="h-4 w-4" />
                  Curated bundles
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="grid grid-cols-2 gap-3 md:gap-4"
            >
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : sections?.heroProducts.map((product, i) => (
                    <HomeProductCard
                      key={product.id}
                      product={product}
                      variant={i === 0 ? 'editorial' : 'compact'}
                      index={i}
                      badges={i === 0 ? ['trending'] : ['selling-fast']}
                      onQuickView={setQuickViewProduct}
                      wishlistIds={wishlistIds}
                      onWishlistChange={setWishlistIds}
                    />
                  ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Flash Deals */}
      {(loading || (sections?.flashDeals.length ?? 0) > 0) && (
        <ProductSection
          title="Flash Deals"
          subtitle="Limited-time savings on bestsellers"
          urgency="Ends soon"
          href="/shop"
          className="bg-gradient-to-r from-accent/5 to-primary/5"
        >
          {loading ? renderSkeletons(4) : renderCarousel(sections!.flashDeals)}
        </ProductSection>
      )}

      {/* Trending */}
      <ProductSection
        title="Trending This Week"
        subtitle="What everyone in Kampala is shopping right now"
        urgency="Hot right now"
        href="/shop"
      >
        {loading ? renderSkeletons(4) : renderCarousel(sections!.trending, 'default')}
      </ProductSection>

      {/* Category showcases with products */}
      {!loading &&
        sections &&
        CATEGORY_GROUPS.map((group, idx) => {
          const groupProducts = getByCategories(products, group.categories, 4);
          if (groupProducts.length === 0) return null;
          return (
            <CategoryShowcase
              key={group.slug}
              title={group.title}
              subtitle={group.subtitle}
              href={group.href}
              gradient={CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length]}
            >
              {renderGrid(groupProducts)}
            </CategoryShowcase>
          );
        })}

      {/* Customers buying now */}
      {!loading && sections && (
        <ProductSection title="" subtitle="" className="pt-0">
          <SocialProofBanner message="Customers are buying this now">
            {renderCarousel(sections.buyingNow)}
          </SocialProofBanner>
        </ProductSection>
      )}

      {/* New Arrivals — editorial masonry */}
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh drops added to our marketplace"
        href="/shop"
      >
        {loading ? (
          renderSkeletons(4)
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {sections!.newArrivals.slice(0, 4).map((product, i) => (
              <div key={product.id} className={i === 0 ? 'md:col-span-2 md:row-span-2' : ''}>
                <HomeProductCard
                  product={product}
                  variant={i === 0 ? 'editorial' : 'default'}
                  badges={['new']}
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
        <ProductSection
          title="Under UGX 500,000"
          subtitle="Premium picks that won't break the bank"
          href="/shop"
        >
          {renderGrid(sections.under50k)}
        </ProductSection>
      )}

      {/* Best Sellers */}
      <ProductSection
        title="Customer Favorites"
        subtitle="Our most-loved products by shoppers like you"
        href="/shop"
      >
        {loading ? renderSkeletons(4) : renderGrid(sections!.bestSellers)}
      </ProductSection>

      <PackageSpotlightSection context="home" />

      {/* Staff Picks */}
      {!loading && sections && (
        <ProductSection
          title="Staff Picks"
          subtitle="Hand-selected by our style experts"
          className="bg-secondary/30"
        >
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
        <ProductSection
          title="Limited Stock"
          subtitle="Grab these before they're gone"
          urgency="Selling fast"
          href="/shop"
        >
          {renderCarousel(sections.limited)}
        </ProductSection>
      )}

      {/* Frequently Bought Together */}
      {!loading && sections && sections.boughtTogether.length >= 2 && (
        <ProductSection
          title="Frequently Bought Together"
          subtitle="Complete your order with these popular pairings"
        >
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
        <ProductSection
          title="Luxury Collection"
          subtitle="Investment pieces for the discerning shopper"
          href="/shop"
        >
          {renderCarousel(sections.luxury, 'default')}
        </ProductSection>
      )}

      {/* Complete the Look */}
      {!loading && sections && (
        <ProductSection
          title="Complete the Look"
          subtitle="Curated combinations from across our marketplace"
          className="bg-secondary/20"
        >
          {renderGrid(sections.completeLook, 'grid-cols-2 md:grid-cols-4')}
        </ProductSection>
      )}

      {/* Personalized: Recommended */}
      {!loading && sections && (
        <ProductSection
          title={viewedIds.length > 0 ? 'Recommended For You' : 'You May Also Like'}
          subtitle={
            viewedIds.length > 0
              ? 'Based on your browsing history'
              : 'Popular picks we think you will love'
          }
          href="/shop"
        >
          {renderGrid(sections.recommended)}
        </ProductSection>
      )}

      {/* Recently Viewed */}
      {!loading && sections && sections.recentlyViewed.length > 0 && (
        <ProductSection title="Recently Viewed" subtitle="Pick up where you left off">
          {renderCarousel(sections.recentlyViewed)}
        </ProductSection>
      )}

      {/* Most Wishlisted */}
      {!loading && sections && (
        <ProductSection
          title="Most Wishlisted"
          subtitle="Save your favorites — join thousands of shoppers"
          href="/shop"
        >
          {renderGrid(sections.wishlisted, 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6', 'compact')}
        </ProductSection>
      )}

      {/* Bottom CTA with product strip */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <TrendingUp className="w-8 h-8 mb-4 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
                Join thousands of happy shoppers
              </h2>
              <p className="opacity-90 mb-6 max-w-md">
                Create an account for personalized recommendations, order tracking, and exclusive
                member offers.
              </p>
              <Link href="/sign-up">
                <Button size="lg" variant="secondary" className="gap-2">
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            {!loading && sections && (
              <div className="grid grid-cols-3 gap-3">
                {sections.trending.slice(0, 3).map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="aspect-square rounded-xl bg-primary-foreground/10 backdrop-blur border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/20 transition"
                  >
                    <span className="text-xs text-center px-2 line-clamp-2 opacity-90">{product.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            Same-week delivery in Kampala
          </span>
          <span className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Secure packaging
          </span>
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            100% authentic products
          </span>
        </div>
      </section>

      <Footer />
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </main>
    </>
  );
}
