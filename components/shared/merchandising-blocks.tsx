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
          urgency="Sale"
          href="/shop"
          className="bg-gradient-to-r from-accent/5 to-primary/5"
        >
          {renderCarousel(sections.flashDeals)}
        </ProductSection>
      )}

      {afterFlashDeals}

      <ProductSection title="Trending" urgency="Hot" href="/shop">
        {renderCarousel(sections.trending, 'default')}
      </ProductSection>

      {showCategoryShowcases &&
        CATEGORY_GROUPS.map((group) => {
          const groupProducts = getByCategories(products, group.categories, 4);
          if (groupProducts.length === 0) return null;
          return (
            <CategoryShowcase key={group.slug} title={group.title} href={group.href}>
              {renderGrid(groupProducts)}
            </CategoryShowcase>
          );
        })}

      <ProductSection title="" className="pt-0">
        <SocialProofBanner message="Live">
          {renderCarousel(sections.buyingNow)}
        </SocialProofBanner>
      </ProductSection>

      <ProductSection title="New" href="/shop">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {sections.newArrivals.slice(0, 4).map((product, i) => (
            <div key={product.id} className={i === 0 ? 'md:col-span-2' : ''}>
              <HomeProductCard
                product={product}
                variant={i === 0 ? 'editorial' : 'default'}
                index={i}
                {...cardProps}
              />
            </div>
          ))}
        </div>
      </ProductSection>

      {sections.under50k.length > 0 && (
        <ProductSection title="Under 500K" href="/shop">
          {renderGrid(sections.under50k)}
        </ProductSection>
      )}

      <ProductSection title="Favorites" href="/shop">
        {renderGrid(sections.bestSellers)}
      </ProductSection>

      <ProductSection title="Staff Picks" className="bg-secondary/30">
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
        <ProductSection title="Limited" urgency="Low stock" href="/shop">
          {renderCarousel(sections.limited)}
        </ProductSection>
      )}

      {sections.boughtTogether.length >= 2 && (
        <ProductSection title="Pairs well with">
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
        <ProductSection title="Wholesale" href="/wholesale" className="bg-primary/5">
          {renderGrid(sections.wholesale, 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6', 'compact')}
        </ProductSection>
      )}

      {sections.luxury.length > 0 && (
        <ProductSection title="Luxury" href="/shop">
          {renderCarousel(sections.luxury, 'default')}
        </ProductSection>
      )}

      <ProductSection title="Complete the look" className="bg-secondary/20">
        {renderGrid(sections.completeLook)}
      </ProductSection>

      <ProductSection
        title={viewedIds.length > 0 ? 'For you' : 'Picks for you'}
        href="/shop"
      >
        {renderGrid(sections.recommended)}
      </ProductSection>

      {sections.recentlyViewed.length > 0 && (
        <ProductSection title="Recent">
          {renderCarousel(sections.recentlyViewed)}
        </ProductSection>
      )}

      <ProductSection title="Wishlisted" href="/shop">
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
          <p className="text-muted-foreground">No matches</p>
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
