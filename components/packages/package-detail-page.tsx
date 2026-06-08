'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { PackageContentsList } from '@/components/packages/package-contents-list';
import { PackagePricingPanel } from '@/components/packages/package-pricing-panel';
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
  getPackageTypeLabel,
  resolvePackageSavings,
} from '@/lib/package-utils';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export function PackageDetailPage() {
  const { packages } = useWholesale();
  const { addItem } = useCart();
  const { products } = useProducts();
  const catalog = productsToCatalog(products);
  const params = useParams();
  const id = params.id as string;

  const pkg = packages.find((p) => p.id === id);
  const productNames = getProductNameMap(catalog);
  const retailPrices = getRetailPricesMap(catalog);
  const coverImages = pkg ? getPackageCoverImages(pkg, products) : [];
  const cartImage = pkg ? getPackageImage(pkg, products) : '';

  if (!pkg) {
    return (
      <main>
        <Header />
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-light mb-4">Package Not Found</h1>
            <Link href="/packages">
              <Button>Back to Packages</Button>
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

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
            Back to Packages
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
                <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  {getPackageTypeLabel(pkg.rule.type)}
                </span>
                <h1 className="text-5xl font-light tracking-tight mb-4">{pkg.name}</h1>
                <p className="text-lg text-muted-foreground">{pkg.description}</p>
              </div>

              <div className="mb-8 p-6 bg-secondary/30 rounded-lg border border-border">
                <h2 className="text-xl font-semibold mb-4">Package Contents</h2>
                <PackageContentsList
                  pkg={pkg}
                  productNames={productNames}
                  retailPrices={retailPrices}
                  products={products}
                />
              </div>

              <div className="p-6 bg-accent/10 rounded-lg border border-accent/30">
                <h3 className="font-semibold mb-4">Why this package</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Carefully curated product selection</li>
                  <li>✓ Special package pricing</li>
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
        </div>
      </section>

      <Footer />
    </main>
  );
}
