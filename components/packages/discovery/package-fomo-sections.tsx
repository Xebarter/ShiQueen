'use client';

import { Package as PackageType } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { ProductSection, ProductCarousel, CarouselItem } from '@/components/home/product-sections';
import { PackageDiscoveryCard } from '@/components/packages/package-discovery-card';
import { getPackageSocialBadge } from '@/lib/package-merchandising';

interface FomoRow {
  title: string;
  subtitle: string;
  urgency?: string;
  packages: PackageType[];
  trending?: boolean;
}

interface PackageFomoSectionsProps {
  rows: FomoRow[];
  products: Product[];
  retailPrices: Record<string, number>;
  onQuickView: (pkg: PackageType) => void;
  onAddToCart: (pkg: PackageType, e: React.MouseEvent) => void;
}

export function PackageFomoSections({
  rows,
  products,
  retailPrices,
  onQuickView,
  onAddToCart,
}: PackageFomoSectionsProps) {
  const visibleRows = rows.filter((r) => r.packages.length > 0);
  if (visibleRows.length === 0) return null;

  return (
    <>
      {visibleRows.map((row) => (
        <ProductSection
          key={row.title}
          title={row.title}
          subtitle={row.subtitle}
          urgency={row.urgency}
          className="border-b border-border/30"
        >
          <ProductCarousel>
            {row.packages.map((pkg, index) => (
              <CarouselItem key={pkg.id} className="w-[min(85vw,18rem)] sm:w-[20rem]">
                <PackageDiscoveryCard
                  pkg={pkg}
                  products={products}
                  retailPrices={retailPrices}
                  index={index}
                  variant="compact"
                  badge={getPackageSocialBadge(pkg, { isTrending: row.trending })}
                  onQuickView={onQuickView}
                  onAddToCart={onAddToCart}
                />
              </CarouselItem>
            ))}
          </ProductCarousel>
        </ProductSection>
      ))}
    </>
  );
}
