'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { usePublicProducts } from '@/lib/hooks/use-public-catalog';
import { PackageSpotlightSection } from '@/components/packages/package-spotlight-section';
import { HomeProductCard, ProductCardSkeleton } from '@/components/home/home-product-card';
import { QuickViewModal } from '@/components/home/quick-view-modal';
import { MerchandisingBlocks } from '@/components/shared/merchandising-blocks';
import { useProductMerchandising } from '@/lib/hooks/use-product-merchandising';
import { HeroMarketingSlot } from '@/components/home/hero-marketing-slot';
import { ShopCategoryStrip } from '@/components/shop/shop-category-strip';
import { CatalogBottomCta } from '@/components/shop/catalog-bottom-cta';

export function HomePage({ children }: { children?: ReactNode }) {
  const { products, loading } = usePublicProducts();
  const {
    sections,
    wishlistIds,
    setWishlistIds,
    viewedIds,
    quickViewProduct,
    setQuickViewProduct,
  } = useProductMerchandising(products);

  return (
    <>
      <Header />
      <main className="overflow-x-clip mobile-scroll-optimize">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="pointer-events-none absolute top-20 right-0 hidden h-96 w-96 rounded-full bg-accent/10 blur-3xl md:block" />
          <div className="relative mx-auto max-w-[90rem] px-3 pt-6 pb-6 sm:px-4 md:pt-10 md:pb-8 lg:px-5">
            <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-8">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                {children}
                <HeroMarketingSlot placement="home-hero" compact />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="grid grid-cols-2 gap-2 sm:gap-2.5"
              >
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                  : sections?.heroProducts.map((product, i) => (
                      <HomeProductCard
                        key={product.id}
                        product={product}
                        variant={i === 0 ? 'editorial' : 'compact'}
                        index={i}
                        priority={i < 2}
                        badges={i === 0 ? ['trending'] : undefined}
                        onQuickView={setQuickViewProduct}
                        wishlistIds={wishlistIds}
                        onWishlistChange={setWishlistIds}
                      />
                    ))}
              </motion.div>
            </div>
          </div>
        </section>

        <ShopCategoryStrip category="all" asLinks />

        {loading ? (
          <div className="mx-auto grid max-w-[90rem] grid-cols-2 gap-2.5 px-3 py-10 md:grid-cols-4 md:gap-3 sm:px-4 lg:px-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : sections ? (
          <MerchandisingBlocks
            products={products}
            sections={sections}
            loading={false}
            wishlistIds={wishlistIds}
            onWishlistChange={setWishlistIds}
            onQuickView={setQuickViewProduct}
            viewedIds={viewedIds}
            showCategoryShowcases
            afterFlashDeals={<PackageSpotlightSection context="home" />}
          />
        ) : (
          <section className="py-20 text-center">
            <p className="text-muted-foreground">No products available</p>
          </section>
        )}

        <CatalogBottomCta />
        <Footer />
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      </main>
    </>
  );
}
