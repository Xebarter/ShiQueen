'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useWholesale } from '@/lib/wholesale-context';
import { useCart } from '@/lib/cart-context';
import { useProducts } from '@/lib/products-context';
import {
  getProductNameMap,
  getRetailPricesMap,
  productsToCatalog,
  formatUGX,
  calculateTax,
  calculateTotalWithTax,
} from '@/lib/wholesale-data';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Minus } from 'lucide-react';

function getBundleTypeLabel(type: string) {
  if (type === 'fixed') return 'Fixed Bundle';
  if (type === 'customizable') return 'Customizable';
  return 'Mix & Match';
}

export default function BundleDetailPage() {
  const { packages } = useWholesale();
  const { addItem } = useCart();
  const { products } = useProducts();
  const catalog = productsToCatalog(products);
  const params = useParams();
  const id = params.id as string;
  const [quantity, setQuantity] = useState(1);

  const bundle = packages.find((pkg) => pkg.id === id);
  const productNames = getProductNameMap(catalog);
  const retailPrices = getRetailPricesMap(catalog);

  if (!bundle) {
    return (
      <main>
        <Header />
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-light mb-4">Bundle Not Found</h1>
            <Link href="/wholesale/bundles">
              <Button>Back to Bundles</Button>
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: bundle.id,
      name: bundle.name,
      price: bundle.discountedPrice,
      image: '',
      quantity,
    });
    toast.success(`${bundle.name} added to cart!`);
  };

  const subtotal = bundle.discountedPrice * quantity;
  const totalRetailValue = bundle.basePrice * quantity;
  const totalSavings = totalRetailValue - subtotal;
  const tax = calculateTax(subtotal);
  const total = calculateTotalWithTax(subtotal);

  return (
    <main>
      <Header />

      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/wholesale/bundles"
            className="flex items-center gap-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bundles
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="mb-6">
                <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  {getBundleTypeLabel(bundle.rule.type)}
                </span>
                <h1 className="text-5xl font-light tracking-tight mb-4">{bundle.name}</h1>
                <p className="text-lg text-muted-foreground">{bundle.description}</p>
              </div>

              <div className="mb-8 p-6 bg-secondary/30 rounded-lg border border-border">
                <h2 className="text-xl font-semibold mb-4">Bundle Contents</h2>
                <div className="space-y-3">
                  {bundle.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between pb-3 border-b border-border last:border-b-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{productNames[item.productId]}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">
                        {formatUGX((retailPrices[item.productId] || 0) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-accent/10 rounded-lg border border-accent/30">
                <h3 className="font-semibold mb-4">Why This Bundle</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Carefully curated product selection</li>
                  <li>✓ Guaranteed wholesale pricing</li>
                  <li>✓ Free shipping on orders over USh 500,000</li>
                  <li>✓ 30-day return guarantee</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="bg-card border border-border rounded-lg p-8 sticky top-4">
                <div className="space-y-4 mb-8 pb-8 border-b border-border">
                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Retail Value (per bundle)</span>
                    <span className="line-through text-lg">{formatUGX(bundle.basePrice)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Wholesale Price (per bundle)</span>
                    <span className="text-3xl font-bold text-primary">
                      {formatUGX(bundle.discountedPrice)}
                    </span>
                  </div>
                  <div className="bg-accent/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Your Savings Per Bundle</p>
                    <p className="text-2xl font-bold text-accent">
                      {formatUGX(bundle.basePrice - bundle.discountedPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {bundle.savingsPercentage.toFixed(1)}% off
                    </p>
                  </div>
                </div>

                <div className="mb-8 pb-8 border-b border-border">
                  <label className="block text-sm font-semibold mb-3">Quantity</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-secondary rounded border border-border"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center border border-border rounded px-3 py-2 font-semibold text-lg"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-secondary rounded border border-border"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-8 p-4 bg-secondary/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatUGX(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (18%)</span>
                    <span>{formatUGX(tax)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatUGX(total)}</span>
                  </div>
                </div>

                {totalSavings > 0 && (
                  <div className="mb-8 p-4 bg-accent/10 rounded-lg border border-accent text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Savings</p>
                    <p className="text-xl font-bold text-accent">{formatUGX(totalSavings)}</p>
                  </div>
                )}

                <Button onClick={handleAddToCart} className="w-full mb-3 py-6 text-lg">
                  Add to Cart
                </Button>
                <Link href="/wholesale">
                  <Button variant="outline" className="w-full">
                    Create Custom Order
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
