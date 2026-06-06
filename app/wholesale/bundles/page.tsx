'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useWholesale } from '@/lib/wholesale-context';
import { useCart } from '@/lib/cart-context';
import { useProducts } from '@/lib/products-context';
import { getProductNameMap, productsToCatalog, formatUGX } from '@/lib/wholesale-data';
import toast from 'react-hot-toast';
import { ArrowRight, Tag } from 'lucide-react';

function getBundleTypeLabel(type: string) {
  if (type === 'fixed') return 'Fixed Bundle';
  if (type === 'customizable') return 'Customizable';
  return 'Mix & Match';
}

export default function BundlesPage() {
  const { packages, setSelectedPackage } = useWholesale();
  const { addItem } = useCart();
  const { products } = useProducts();
  const productNames = getProductNameMap(productsToCatalog(products));
  const activePackages = packages.filter((p) => p.isActive);

  const handleAddToCart = (pkg: (typeof packages)[0], e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPackage(pkg);
    addItem({
      id: pkg.id,
      name: pkg.name,
      price: pkg.discountedPrice,
      image: '',
      quantity: 1,
    });
    toast.success('Bundle added to cart!');
  };

  return (
    <main>
      <Header />

      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-5xl font-light tracking-tight mb-2">Wholesale Bundles</h1>
            <p className="text-muted-foreground text-lg">
              Curated package deals designed for maximum value and savings
            </p>
          </div>

          {activePackages.length === 0 ? (
            <div className="bg-secondary/50 rounded-lg p-12 text-center">
              <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">No bundles available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {activePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-card border border-border rounded-lg p-6 h-full hover:shadow-lg transition flex flex-col"
                >
                  <Link href={`/wholesale/bundles/${pkg.id}`} className="flex-1 flex flex-col">
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold mb-2">{pkg.name}</h2>
                      <p className="text-muted-foreground">{pkg.description}</p>
                    </div>

                    <div className="mb-6 p-4 bg-secondary/50 rounded">
                      <p className="text-sm font-semibold text-muted-foreground mb-3">Includes:</p>
                      <ul className="space-y-2">
                        {pkg.items.map((item) => (
                          <li key={item.productId} className="text-sm">
                            <span className="font-medium">{productNames[item.productId]}</span>
                            <span className="text-muted-foreground"> × {item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6 space-y-3 flex-grow">
                      <div className="flex justify-between items-center pb-3 border-b border-border">
                        <span className="text-muted-foreground">Retail Value</span>
                        <span className="line-through text-sm">{formatUGX(pkg.basePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-semibold">Wholesale Price</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatUGX(pkg.discountedPrice)}
                        </span>
                      </div>
                      <div className="bg-accent/20 text-accent rounded px-4 py-2 text-center font-bold text-lg">
                        Save {pkg.savingsPercentage.toFixed(1)}% (
                        {formatUGX(pkg.basePrice - pkg.discountedPrice)})
                      </div>
                    </div>

                    <div className="mb-6">
                      <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                        {getBundleTypeLabel(pkg.rule.type)}
                      </span>
                    </div>
                  </Link>

                  <Button onClick={(e) => handleAddToCart(pkg, e)} className="w-full gap-2">
                    Add to Cart
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-secondary/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-light tracking-tight mb-8">How Bundle Types Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Fixed Bundles</h3>
              <p className="text-muted-foreground text-sm">
                Pre-selected product combinations with guaranteed pricing. Perfect for standardized
                wholesale orders.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Customizable Bundles</h3>
              <p className="text-muted-foreground text-sm">
                Build your own bundle while maintaining the wholesale price. Mix quantities and
                select variations.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Mix & Match</h3>
              <p className="text-muted-foreground text-sm">
                Create flexible combinations from available products. Choose any items up to the
                bundle limit.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
