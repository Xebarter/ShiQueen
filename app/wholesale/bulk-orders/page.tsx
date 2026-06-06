'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useWholesale } from '@/lib/wholesale-context';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useProducts } from '@/lib/products-context';
import {
  productsToCatalog,
  getTieredPrice,
  formatUGX,
  calculateTax,
  calculateTotalWithTax,
} from '@/lib/wholesale-data';
import toast from 'react-hot-toast';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';

interface BulkItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
}

export default function BulkOrdersPage() {
  const { createBulkOrder } = useWholesale();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { products } = useProducts();
  const catalog = productsToCatalog(products);
  const [items, setItems] = useState<BulkItem[]>([]);

  const addProduct = (productId: string) => {
    const product = catalog.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = items.find((i) => i.productId === productId);
    if (existingItem) {
      updateQuantity(productId, existingItem.quantity + 1);
    } else {
      const { unitPrice } = getTieredPrice(product.basePrice, 1);
      setItems([
        ...items,
        {
          productId,
          name: product.name,
          quantity: 1,
          unitPrice,
          basePrice: product.basePrice,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(
      items.map((item) => {
        if (item.productId === productId) {
          const { unitPrice } = getTieredPrice(item.basePrice, quantity);
          return { ...item, quantity, unitPrice };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const savings = items.reduce(
    (sum, item) => sum + item.quantity * (item.basePrice - item.unitPrice),
    0
  );
  const tax = calculateTax(subtotal);
  const total = calculateTotalWithTax(subtotal);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Please add items to your bulk order');
      return;
    }

    try {
      await createBulkOrder({
        id: `bulk-${Date.now()}`,
        customerId: user?.uid || user?.email || 'guest',
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
        totalAmount: subtotal,
        orderType: 'wholesale',
        status: 'pending',
        requestedAt: new Date(),
      });

      items.forEach((item) => {
        addItem({
          id: item.productId,
          name: item.name,
          price: item.unitPrice,
          image: '',
          quantity: item.quantity,
        });
      });

      toast.success(`Added ${items.length} items to cart`);
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 1000);
    } catch {
      toast.error('Failed to save bulk order');
    }
  };

  return (
    <main>
      <Header />

      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-light tracking-tight mb-2">Bulk Order Builder</h1>
            <p className="text-muted-foreground">
              Customize your wholesale order with volume discounts applied automatically
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Add Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {catalog.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product.id)}
                      className="p-3 border border-border rounded-lg hover:bg-secondary transition text-left"
                    >
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatUGX(product.basePrice)}</p>
                      <p className="text-xs text-primary mt-1">MOQ: {product.minOrderQuantity}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Your Order</h2>
                {items.length === 0 ? (
                  <div className="bg-secondary/50 rounded-lg p-8 text-center">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.productId}
                        className="bg-card border border-border rounded-lg p-4 flex items-center justify-between flex-wrap gap-4"
                      >
                        <div className="flex-1 min-w-[150px]">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatUGX(item.unitPrice)} per unit
                          </p>
                          {item.unitPrice < item.basePrice && (
                            <p className="text-xs text-accent">
                              Saving {formatUGX(item.basePrice - item.unitPrice)}/unit
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-secondary rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.productId, parseInt(e.target.value) || 0)
                            }
                            className="w-16 text-center border border-border rounded px-2 py-1"
                          />
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-secondary rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-right min-w-[120px]">
                          <p className="font-semibold">
                            {formatUGX(item.quantity * item.unitPrice)}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.quantity} units</p>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-2 hover:bg-destructive/10 rounded text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                <div className="space-y-4 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span>{items.reduce((sum, item) => sum + item.quantity, 0)} units</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Product Count</span>
                    <span>{items.length} products</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatUGX(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (18%)</span>
                    <span>{formatUGX(tax)}</span>
                  </div>
                </div>

                {savings > 0 && (
                  <div className="mb-6 p-4 bg-accent/10 rounded border border-accent">
                    <p className="text-sm text-muted-foreground mb-1">Wholesale Savings</p>
                    <p className="text-lg font-bold text-accent">{formatUGX(savings)}</p>
                  </div>
                )}

                <div className="mb-6 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatUGX(total)}</span>
                </div>

                <Button onClick={handleCheckout} className="w-full mb-3" disabled={items.length === 0}>
                  Proceed to Checkout
                </Button>

                <Link href="/wholesale">
                  <Button variant="outline" className="w-full">
                    Back to Wholesale
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
