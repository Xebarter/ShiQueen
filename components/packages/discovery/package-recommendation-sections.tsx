'use client';

import { Package as PackageType } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { ProductSection, ProductCarousel, CarouselItem } from '@/components/home/product-sections';
import { PackageDiscoveryCard } from '@/components/packages/package-discovery-card';

interface PackageRecommendationSectionsProps {
  recommended: PackageType[];
  upgradeFrom?: PackageType | null;
  upgrades: PackageType[];
  products: Product[];
  retailPrices: Record<string, number>;
  onQuickView: (pkg: PackageType) => void;
  onAddToCart: (pkg: PackageType, e: React.MouseEvent) => void;
}

export function PackageRecommendationSections({
  recommended,
  upgradeFrom,
  upgrades,
  products,
  retailPrices,
  onQuickView,
  onAddToCart,
}: PackageRecommendationSectionsProps) {
  return (
    <>
      {recommended.length > 0 && (
        <ProductSection
          title="Recommended for you"
          subtitle="Based on bundles you've explored"
          className="border-b border-border/30"
        >
          <ProductCarousel>
            {recommended.map((pkg, index) => (
              <CarouselItem key={pkg.id} className="w-[min(85vw,18rem)] sm:w-[20rem]">
                <PackageDiscoveryCard
                  pkg={pkg}
                  products={products}
                  retailPrices={retailPrices}
                  index={index}
                  variant="compact"
                  onQuickView={onQuickView}
                  onAddToCart={onAddToCart}
                />
              </CarouselItem>
            ))}
          </ProductCarousel>
        </ProductSection>
      )}

      {upgradeFrom && upgrades.length > 0 && (
        <ProductSection
          title="Complete your collection"
          subtitle={`Upgrade from ${upgradeFrom.name}`}
          className="border-b border-border/30"
        >
          <ProductCarousel>
            {upgrades.map((pkg, index) => (
              <CarouselItem key={pkg.id} className="w-[min(85vw,18rem)] sm:w-[20rem]">
                <PackageDiscoveryCard
                  pkg={pkg}
                  products={products}
                  retailPrices={retailPrices}
                  index={index}
                  variant="compact"
                  onQuickView={onQuickView}
                  onAddToCart={onAddToCart}
                />
              </CarouselItem>
            ))}
          </ProductCarousel>
        </ProductSection>
      )}
    </>
  );
}
