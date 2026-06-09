'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { PackageContentsList } from '@/components/packages/package-contents-list';
import { PackagePricingPanel } from '@/components/packages/package-pricing-panel';
import { PackageCard } from '@/components/packages/package-card';
import { PackageCategoryIcon } from '@/components/packages/package-category-icon';
import { useWholesale } from '@/lib/wholesale-context';
import { useCart } from '@/lib/cart-context';
import { useProducts } from '@/lib/products-context';
import {
  getProductNameMap,
  getRetailPricesMap,
  productsToCatalog,
} from '@/lib/wholesale-data';
import { PackageCoverDisplay } from '@/components/packages/package-cover-display';
import {
  getPackageCoverImages,
  getPackageImage,
  mergePackageItemMaps,
  resolvePackageSavings,
} from '@/lib/package-utils';
import {
  getDefaultHighlights,
  getPackageCategoryLabel,
  getPackageTierLabel,
} from '@/lib/package-catalog';
import toast from 'react-hot-toast';
import { ArrowLeft, Star } from 'lucide-react';

export function PackageDetailPage() {
  const { packages } = useWholesale();
  const { addItem } = useCart();
  const { products } = useProducts();
  const catalog = productsToCatalog(products);
  const params = useParams();
  const id = params.id as string;

  const pkg = packages.find((p) => p.id === id);

  const relatedPackages = useMemo(() => {
    if (!pkg) return [];
    return packages
      .filter(
        (p) =>
          p.isActive &&
          p.id !== pkg.id &&
          p.category &&
          pkg.category &&
          p.category === pkg.category
      )
      .slice(0, 3);
  }, [packages, pkg]);

  const { productNames, retailPrices } = useMemo(
    () =>
      mergePackageItemMaps(
        pkg ? [pkg, ...relatedPackages] : [],
        getProductNameMap(catalog),
        getRetailPricesMap(catalog)
      ),
    [pkg, relatedPackages, catalog]
  );

  const coverImages = pkg ? getPackageCoverImages(pkg, products) : [];
  const cartImage = pkg ? getPackageImage(pkg, products) : '';

  if (!pkg) {
    return (
      <main>
        <Header />
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-light mb-4">Bundle Not Found</h1>
            <Link href="/packages">
              <Button>Back to Bundles</Button>
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const whyBullets =
    pkg.highlights && pkg.highlights.length > 0
      ? pkg.highlights
      : getDefaultHighlights(pkg.category);

  const handleAddToCart = (quantity: number) => {
    const { packagePrice } = resolvePackageSavings(pkg, retailPrices);
    addItem({
      id: pkg.id,
      name: pkg.name,
      price: packagePrice,
      image: cartImage,
      quantity,
    });
    toast.success(`${pkg.name} added to cart!`);
  };

  const handleRelatedAddToCart = (
    relatedPkg: (typeof packages)[0],
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const { packagePrice } = resolvePackageSavings(relatedPkg, retailPrices);
    addItem({
      id: relatedPkg.id,
      name: relatedPkg.name,
      price: packagePrice,
      image: getPackageImage(relatedPkg, products),
      quantity: 1,
    });
    toast.success(`${relatedPkg.name} added to cart!`);
  };

  return (
    <main>
      <Header />

      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/packages"
            className="flex items-center gap-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bundles
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="relative mb-8 aspect-square overflow-hidden rounded-lg bg-muted">
                <PackageCoverDisplay
                  images={coverImages}
                  alt={pkg.name}
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
              </div>

              <div className="mb-6">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {pkg.category && (
                    <Link
                      href={`/packages?category=${pkg.category}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/15"
                    >
                      <PackageCategoryIcon categoryId={pkg.category} className="h-3.5 w-3.5" />
                      {getPackageCategoryLabel(pkg.category)}
                    </Link>
                  )}
                  {pkg.isSignature && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                      <Star className="h-3.5 w-3.5" />
                      SheQueen Signature
                    </span>
                  )}
                  {pkg.tier && (
                    <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                      {getPackageTierLabel(pkg.tier)}
                    </span>
                  )}
                </div>
                <h1 className="text-5xl font-light tracking-tight mb-3">{pkg.name}</h1>
                {pkg.tagline && (
                  <p className="text-lg font-medium text-foreground/90 mb-3">{pkg.tagline}</p>
                )}
                <p className="text-lg text-muted-foreground">{pkg.description}</p>
              </div>

              <div className="mb-8 p-6 bg-secondary/30 rounded-lg border border-border">
                <h2 className="text-xl font-semibold mb-4">What&apos;s included</h2>
                <PackageContentsList
                  pkg={pkg}
                  productNames={productNames}
                  retailPrices={retailPrices}
                  products={products}
                />
              </div>

              <div className="p-6 bg-accent/10 rounded-lg border border-accent/30">
                <h3 className="font-semibold mb-4">Why this bundle</h3>
                <ul className="space-y-2 text-sm">
                  {whyBullets.map((bullet, index) => (
                    <li key={index}>✓ {bullet}</li>
                  ))}
                  <li>✓ Free shipping on orders over USh 500,000</li>
                  <li>✓ 30-day return guarantee</li>
                </ul>
              </div>
            </div>

            <div>
              <PackagePricingPanel
                pkg={pkg}
                retailPrices={retailPrices}
                onAddToCart={handleAddToCart}
              />
            </div>
          </div>

          {relatedPackages.length > 0 && (
            <div className="mt-16 border-t border-border pt-12">
              <h2 className="text-2xl font-light tracking-tight mb-6">
                More {getPackageCategoryLabel(pkg.category).toLowerCase()}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPackages.map((relatedPkg, index) => (
                  <PackageCard
                    key={relatedPkg.id}
                    pkg={relatedPkg}
                    productNames={productNames}
                    retailPrices={retailPrices}
                    products={products}
                    index={index}
                    onAddToCart={handleRelatedAddToCart}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
