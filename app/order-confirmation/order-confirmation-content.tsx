'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { getOrder } from '@/lib/firebase/orders';
import { Order } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { CheckCircle, Package, Truck, Loader2 } from 'lucide-react';

export default function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentParam = searchParams.get('payment');
  const paymentPending = paymentParam === 'pending';
  const paymentOffline = paymentParam === 'offline';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) return;
    getOrder(orderId).then((result) => {
      setOrder(result);
      setLoading(false);
    });
  }, [orderId]);

  const steps = [
    { icon: CheckCircle, label: 'Order Confirmed', description: 'Your order has been received', completed: true },
    { icon: Package, label: 'Processing', description: "We're preparing your items", completed: false },
    { icon: Truck, label: 'Shipped', description: 'On its way to you', completed: false },
  ];

  return (
    <main>
      <Header />

      <section className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-2xl">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-4xl font-light tracking-tight mb-2">
              {paymentOffline
                ? 'Order received'
                : paymentPending || order?.paymentStatus === 'awaiting_payment'
                  ? 'Almost there!'
                  : 'Thank You!'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {paymentOffline
                ? 'Paytota was unavailable, but your order is saved. Our team will contact you to complete mobile money payment.'
                : paymentPending || order?.paymentStatus === 'awaiting_payment'
                  ? order?.paymentMethod === 'card'
                    ? 'We’re confirming your card payment. Your order will update automatically once it succeeds.'
                    : 'Approve the Paytota prompt on your phone to complete payment.'
                  : 'Your order has been successfully placed'}
            </p>
          </div>

          <div className="bg-secondary rounded-lg p-8 mb-8">
            <p className="text-muted-foreground mb-2">Order Number</p>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            ) : (
              <p className="text-2xl font-semibold font-mono">{order?.id ?? orderId ?? '—'}</p>
            )}
            {order && (
              <>
                <p className="text-sm text-muted-foreground mt-2">Total: {formatUGX(order.total)}</p>
                {order.paymentMethod === 'mobile_money' && (
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    Payment: {order.paymentStatus?.replace('_', ' ') ?? 'processing'}
                  </p>
                )}
                {order.paymentMethod === 'card' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Payment:{' '}
                    {order.paymentStatus === 'paid'
                      ? 'Card paid'
                      : order.paymentStatus === 'awaiting_payment'
                        ? 'Card checkout in progress'
                        : (order.paymentStatus ?? 'processing').replace('_', ' ')}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mb-12 space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">{step.label}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/account">
              <Button size="lg">View Orders</Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
