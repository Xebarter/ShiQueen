'use client';

import { ReactNode } from 'react';
import { Product } from '@/lib/types/database';
import { HomeProductCard, ProductCardSkeleton } from '@/components/home/home-product-card';
import {
  ProductSection,
  ProductCarousel,
  CarouselItem,
  CategoryShowcase,
  SocialProofBanner,
} from '@/components/home/product-sections';
import { MerchandisingSections, ProductCardVariant } from '@/lib/hooks/use-product-merchandising';
import { getByCategories } from '@/lib/home-merchandising';
import { CATEGORY_GROUPS } from '@/lib/home-merchandising';

const CATEGORY_GRADIENTS = [
  'bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950/30 dark:to-pink-950/20',
  'bg-gradient-to-br from-fuchsia-50 to-rose-100 dark:from-fuchsia-950/30 dark:to-rose-950/20',
  'bg-gradient-to-br from-amber-50 to-rose-100 dark:from-amber-950/25 dark:to-rose-950/20',
];

interface MerchandisingBlocksProps {
  products: Product[];
  sections: MerchandisingSections;
  loading: boolean;
  wishlistIds: string[];
  onWishlistChange: (ids: string[]) => void;
  onQuickView: (product: Product) => void;
  showCategoryShowcases?: boolean;
  viewedIds: string[];
  afterFlashDeals?: ReactNode;
}

export function MerchandisingBlocks({
  products,
  sections,
  loading,
  wishlistIds,
  onWishlistChange,
  onQuickView,
  showCategoryShowcases = true,
  viewedIds,
  afterFlashDeals,
}: MerchandisingBlocksProps) {
  const cardProps = {
    onQuickView,
    wishlistIds,
    onWishlistChange,
  };

  const renderGrid = (
    items: Product[],
    cols = 'grid-cols-2 md:grid-cols-4',
    variant: ProductCardVariant = 'default',
    badges?: (i: number) => ('trending' | 'new' | 'selling-fast' | 'limited')[] | undefined
  ) => (
    <div className={`grid ${cols} gap-4 md:gap-5`}>
      {items.map((product, i) => (
        <HomeProductCard
          key={product.id}
          product={product}
          variant={variant}
          index={i}
          badges={badges?.(i)}
          {...cardProps}
        />
      ))}
    </div>
  );

  const renderCarousel = (items: Product[], variant: ProductCardVariant = 'compact') => (
    <ProductCarousel>
      {items.map((product, i) => (
        <CarouselItem key={product.id}>
          <HomeProductCard product={product} variant={variant} index={i} {...cardProps} />
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

  if (loading) {
    return (
      <div className="space-y-16">
        {renderSkeletons(8)}
      </div>
    );
  }

  return (
    <>
      {(sections.flashDeals.length > 0) && (
        <ProductSection
          title="Flash Deals"
          subtitle="Limited-time savings"
          urgency="Ends soon"
          href="/shop"
          className="bg-gradient-to-r from-accent/5 to-primary/5"
        >
          {renderCarousel(sections.flashDeals)}
        </ProductSection>
      )}

      {afterFlashDeals}

      <ProductSection
        title="Trending This Week"
        subtitle="What shoppers are loving right now"
        urgency="Hot right now"
        href="/shop"
      >
        {renderCarousel(sections.trending, 'default')}
      </ProductSection>

      {showCategoryShowcases &&
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

      <ProductSection title="" subtitle="" className="pt-0">
        <SocialProofBanner message="Customers are buying this now">
          {renderCarousel(sections.buyingNow)}
        </SocialProofBanner>
      </ProductSection>

      <ProductSection title="New Arrivals" subtitle="Fresh drops in our marketplace" href="/shop">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {sections.newArrivals.slice(0, 4).map((product, i) => (
            <div key={product.id} className={i === 0 ? 'md:col-span-2' : ''}>
              <HomeProductCard
                product={product}
                variant={i === 0 ? 'editorial' : 'default'}
                badges={['new']}
                index={i}
                {...cardProps}
              />
            </div>
          ))}
        </div>
      </ProductSection>

      {sections.under50k.length > 0 && (
        <ProductSection title="Under UGX 500,000" subtitle="Premium picks at accessible prices" href="/shop">
          {renderGrid(sections.under50k)}
        </ProductSection>
      )}

      <ProductSection title="Customer Favorites" subtitle="Top-rated by our community" href="/shop">
        {renderGrid(sections.bestSellers)}
      </ProductSection>

      <ProductSection title="Staff Picks" subtitle="Curated by our style team" className="bg-secondary/30">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            {sections.staffPicks[0] && (
              <HomeProductCard
                product={sections.staffPicks[0]}
                variant="editorial"
                badges={['trending']}
                {...cardProps}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {sections.staffPicks.slice(1, 5).map((product, i) => (
              <HomeProductCard key={product.id} product={product} variant="compact" index={i} {...cardProps} />
            ))}
          </div>
        </div>
      </ProductSection>

      {sections.limited.length > 0 && (
        <ProductSection title="Limited Stock" subtitle="Selling fast — don't miss out" urgency="Only a few left" href="/shop">
          {renderCarousel(sections.limited)}
        </ProductSection>
      )}

      {sections.boughtTogether.length >= 2 && (
        <ProductSection title="Frequently Bought Together" subtitle="Popular product pairings">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {sections.boughtTogether.map((product, i) => (
              <div key={product.id} className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                {i > 0 && <span className="hidden md:block text-2xl text-muted-foreground">+</span>}
                <div className="flex-1 md:w-48">
                  <HomeProductCard product={product} variant="compact" index={i} {...cardProps} />
                </div>
              </div>
            ))}
          </div>
        </ProductSection>
      )}

      {sections.wholesale.length > 0 && (
        <ProductSection
          title="Wholesale Deals"
          subtitle="Volume pricing for bulk buyers"
          href="/wholesale"
          className="bg-primary/5"
        >
          {renderGrid(sections.wholesale, 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6', 'compact')}
        </ProductSection>
      )}

      {sections.luxury.length > 0 && (
        <ProductSection title="Luxury Collection" subtitle="Premium investment pieces" href="/shop">
          {renderCarousel(sections.luxury, 'default')}
        </ProductSection>
      )}

      <ProductSection title="Complete the Look" subtitle="Shop curated combinations" className="bg-secondary/20">
        {renderGrid(sections.completeLook)}
      </ProductSection>

      <ProductSection
        title={viewedIds.length > 0 ? 'Recommended For You' : 'You May Also Like'}
        subtitle={viewedIds.length > 0 ? 'Based on your browsing' : 'Popular picks for you'}
        href="/shop"
      >
        {renderGrid(sections.recommended)}
      </ProductSection>

      {sections.recentlyViewed.length > 0 && (
        <ProductSection title="Recently Viewed" subtitle="Continue where you left off">
          {renderCarousel(sections.recentlyViewed)}
        </ProductSection>
      )}

      <ProductSection title="Most Wishlisted" subtitle="Community favorites" href="/shop">
        {renderGrid(sections.wishlisted, 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6', 'compact')}
      </ProductSection>
    </>
  );
}

interface AllProductsGridProps {
  products: Product[];
  wishlistIds: string[];
  onWishlistChange: (ids: string[]) => void;
  onQuickView: (product: Product) => void;
  emptyMessage?: ReactNode;
}

export function AllProductsGrid({
  products,
  wishlistIds,
  onWishlistChange,
  onQuickView,
  emptyMessage,
}: AllProductsGridProps) {
  if (products.length === 0) {
    return (
      emptyMessage ?? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No products match your filters</p>
        </div>
      )
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
      {products.map((product, i) => (
        <HomeProductCard
          key={product.id}
          product={product}
          variant="default"
          index={i}
          onQuickView={onQuickView}
          wishlistIds={wishlistIds}
          onWishlistChange={onWishlistChange}
        />
      ))}
    </div>
  );
}
