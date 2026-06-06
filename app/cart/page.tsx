'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart-context';
import { Trash2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <main>
        <Header />
        <section className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-light tracking-tight mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Explore our collections and find something you love.
            </p>
            <Link href="/shop">
              <Button className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <Header />

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-light tracking-tight mb-12">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-6 border-b border-border"
                  >
                    <div className="flex-shrink-0 w-24 h-24 bg-secondary rounded-lg flex items-center justify-center">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                      {item.size && (
                        <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                      )}
                      {item.color && (
                        <p className="text-sm text-muted-foreground">Color: {item.color}</p>
                      )}
                      <p className="font-semibold mt-2">USh {item.price.toLocaleString('en-UG', { maximumFractionDigits: 0 })}</p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="flex items-center gap-2 border border-border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-muted-foreground hover:text-foreground"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 font-semibold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-muted-foreground hover:text-foreground"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => clearCart()}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-secondary rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>USh {total.toLocaleString('en-UG', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-accent font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (18%)</span>
                    <span>USh {Math.round(total * 0.18).toLocaleString('en-UG', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <div className="flex justify-between font-semibold mb-6 text-lg">
                  <span>Total</span>
                  <span>USh {Math.round(total * 1.18).toLocaleString('en-UG', { maximumFractionDigits: 0 })}</span>
                </div>

                <Link href="/checkout" className="w-full">
                  <Button className="w-full mb-3">Proceed to Checkout</Button>
                </Link>
                <Link href="/shop" className="w-full">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
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
