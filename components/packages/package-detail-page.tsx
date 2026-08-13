'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { PackageContentsList } from '@/components/packages/package-contents-list';
import { PackagePricingPanel } from '@/components/packages/package-pricing-panel';
import { PackageCard } from '@/components/packages/package-card';
import { PackageCategoryIcon } from '@/components/packages/package-category-icon';
import { useCart } from '@/lib/cart-context';
import { usePublicProducts, usePublicPackages } from '@/lib/hooks/use-public-catalog';
import { formatUGX } from '@/lib/wholesale-data';
import { PackageCoverDisplay } from '@/components/packages/package-cover-display';
import {
  buildPackageCatalogMaps,
  getPackageCoverImages,
  getPackageImage,
  resolvePackageSavings,
} from '@/lib/package-utils';
import {
  getDefaultHighlights,
  getPackageCategoryLabel,
  getPackageTierLabel,
} from '@/lib/package-catalog';
import toast from 'react-hot-toast';
import { ArrowLeft, ChevronRight, Star } from 'lucide-react';
import { SharePackageButton } from '@/components/shared/share-button';
import { useSmartBack } from '@/lib/hooks/use-smart-back';
import { useServices } from '@/lib/services-context';

function PackageBreadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="Package" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm sm:mb-6">
      <Link href="/" className="text-muted-foreground transition hover:text-foreground">
        Home
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
      <Link href="/packages" className="text-muted-foreground transition hover:text-foreground">
        Bundles
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
      <span className="line-clamp-1 font-medium text-foreground">{name}</span>
    </nav>
  );
}

export function PackageDetailPage() {
  const { packages } = usePublicPackages();
  const { addItem } = useCart();
  const { products } = usePublicProducts();
  const { activeListings } = useServices();
  const params = useParams();
  const id = params.id as string;
  const goBack = useSmartBack('/packages');
  const [quantity, setQuantity] = useState(1);

  const pkg = packages.find((p) => p.id === id && p.isActive);

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
      buildPackageCatalogMaps(
        products,
        activeListings,
        pkg ? [pkg, ...relatedPackages] : []
      ),
    [pkg, relatedPackages, products, activeListings]
  );

  const coverImages = pkg ? getPackageCoverImages(pkg, products, activeListings) : [];
  const cartImage = pkg ? getPackageImage(pkg, products, activeListings) : '';

  if (!pkg) {
    return (
      <main>
        <Header />
        <section className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="mb-3 text-2xl font-light tracking-tight sm:text-3xl">Bundle not found</h1>
          <p className="mb-8 max-w-sm text-sm text-muted-foreground">
            This bundle may have been removed or the link is incorrect.
          </p>
          <Link href="/packages">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to bundles
            </Button>
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  const whyBullets =
    pkg.highlights && pkg.highlights.length > 0
      ? pkg.highlights
      : getDefaultHighlights(pkg.category);

  const { packagePrice } = resolvePackageSavings(pkg, retailPrices);
  const lineTotal = packagePrice * quantity;

  const handleAddToCart = (qty: number) => {
    addItem({
      id: pkg.id,
      name: pkg.name,
      price: packagePrice,
      image: cartImage,
      quantity: qty,
    });
    toast.success(`${pkg.name} added to cart!`);
  };

  const handleRelatedAddToCart = (
    relatedPkg: (typeof packages)[0],
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const { packagePrice: relatedPrice } = resolvePackageSavings(relatedPkg, retailPrices);
    addItem({
      id: relatedPkg.id,
      name: relatedPkg.name,
      price: relatedPrice,
      image: getPackageImage(relatedPkg, products),
      quantity: 1,
    });
    toast.success(`${relatedPkg.name} added to cart!`);
  };

  return (
    <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
      <Header />

      <section className="py-6 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={goBack}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground sm:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <PackageBreadcrumb name={pkg.name} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            {/* Gallery */}
            <div className="min-w-0">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-secondary ring-1 ring-border/40 sm:rounded-2xl">
                <PackageCoverDisplay
                  images={coverImages}
                  alt={pkg.name}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Package info */}
            <div className="min-w-0">
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
                    ShiQueen Signature
                  </span>
                )}
                {pkg.tier && (
                  <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                    {getPackageTierLabel(pkg.tier)}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-light leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                {pkg.name}
              </h1>

              {pkg.tagline && (
                <p className="mt-2 text-base font-medium text-foreground/90 sm:mt-3 sm:text-lg">
                  {pkg.tagline}
                </p>
              )}

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
                {pkg.description}
              </p>

              <div className="mt-6 sm:mt-8">
                <PackagePricingPanel
                  pkg={pkg}
                  retailPrices={retailPrices}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  onAddToCart={handleAddToCart}
                />
              </div>

              <div className="mt-4 space-y-3">
                <SharePackageButton pkg={pkg} variant="button" size="lg" className="min-h-11 w-full" />
                <Link href="/shop" className="block sm:hidden">
                  <Button variant="outline" className="min-h-11 w-full">
                    Shop individual items
                  </Button>
                </Link>
              </div>

              <div className="mt-8 rounded-xl border border-border bg-secondary/30 p-4 sm:mt-10 sm:rounded-2xl sm:p-6">
                <h2 className="mb-3 text-base font-semibold sm:mb-4 sm:text-xl">What&apos;s included</h2>
                <PackageContentsList
                  pkg={pkg}
                  productNames={productNames}
                  retailPrices={retailPrices}
                  products={products}
                  services={activeListings}
                />
              </div>

              <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4 sm:mt-8 sm:rounded-2xl sm:p-6">
                <h3 className="mb-3 text-base font-semibold sm:mb-4">Why this bundle</h3>
                <ul className="space-y-2 text-sm leading-relaxed sm:text-base">
                  {whyBullets.map((bullet, index) => (
                    <li key={index} className="flex gap-2.5 text-muted-foreground">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                      <span>{bullet}</span>
                    </li>
                  ))}
                  <li className="flex gap-2.5 text-muted-foreground">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span>Free shipping on orders over USh 500,000</span>
                  </li>
                  <li className="flex gap-2.5 text-muted-foreground">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span>30-day return guarantee</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {relatedPackages.length > 0 && (
            <div className="mt-12 border-t border-border pt-8 sm:mt-16 sm:pt-12">
              <h2 className="mb-4 text-xl font-light tracking-tight sm:mb-6 sm:text-2xl">
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

      {/* Mobile sticky add-to-cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden">
        <div className="flex items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{pkg.name}</p>
            <p className="text-lg font-semibold tabular-nums">{formatUGX(lineTotal)}</p>
          </div>
          <Button
            size="lg"
            className="min-h-11 shrink-0 px-6"
            onClick={() => handleAddToCart(quantity)}
          >
            Add to cart
          </Button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
