'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart-context';
import { cn } from '@/lib/utils';

type PaymentResultVariant = 'success' | 'failure' | 'cancel' | 'pending';

const VARIANT_CONFIG: Record<
  PaymentResultVariant,
  {
    title: string;
    orderDescription: string;
    bookingDescription: string;
    icon: typeof CheckCircle;
    iconClass: string;
    clearCart: boolean;
  }
> = {
  success: {
    title: 'Payment successful',
    orderDescription: 'Thank you! Your payment was received and your order is being confirmed.',
    bookingDescription:
      'Thank you! Your payment was received and your service booking is being confirmed.',
    icon: CheckCircle,
    iconClass: 'bg-emerald-500/10 text-emerald-600',
    clearCart: true,
  },
  pending: {
    title: 'Confirming your payment',
    orderDescription:
      'We’re confirming your card payment. This can take a moment — your order will update automatically once it goes through.',
    bookingDescription:
      'We’re confirming your card payment. This can take a moment — your booking will update automatically once it goes through.',
    icon: Loader2,
    iconClass: 'bg-primary/10 text-primary',
    clearCart: true,
  },
  failure: {
    title: 'Payment failed',
    orderDescription: 'We could not process your payment. You can try again from checkout.',
    bookingDescription: 'We could not process your payment. You can try booking again.',
    icon: XCircle,
    iconClass: 'bg-red-500/10 text-red-600',
    clearCart: false,
  },
  cancel: {
    title: 'Payment cancelled',
    orderDescription: 'You cancelled the payment. Your order was not charged.',
    bookingDescription: 'You cancelled the payment. Your booking was not charged.',
    icon: AlertCircle,
    iconClass: 'bg-amber-500/10 text-amber-600',
    clearCart: false,
  },
};

export function PaymentResultPage({ variant }: { variant: PaymentResultVariant }) {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const bookingId = searchParams.get('bookingId');
  const isBooking = Boolean(bookingId);
  const { clearCart } = useCart();
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  useEffect(() => {
    if (config.clearCart && !isBooking) {
      clearCart();
    }
  }, [clearCart, config.clearCart, isBooking]);

  return (
    <main>
      <Header />
      <section className="min-h-[calc(100vh-8rem)] bg-muted/20 py-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div
            className={cn(
              'mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full',
              config.iconClass
            )}
          >
            <Icon className={cn('h-8 w-8', variant === 'pending' && 'animate-spin')} />
          </div>

          <h1 className="text-3xl font-light tracking-tight">{config.title}</h1>
          <p className="mt-3 text-muted-foreground">
            {isBooking ? config.bookingDescription : config.orderDescription}
          </p>

          {bookingId ? (
            <div className="mt-8 rounded-xl border border-border/70 bg-card p-6">
              <p className="text-sm text-muted-foreground">Booking reference</p>
              <p className="mt-1 font-mono text-lg font-semibold text-primary">{bookingId}</p>
              {variant === 'success' && (
                <p className="mt-3 text-xs text-muted-foreground">
                  If confirmation takes a moment, your booking will update automatically once
                  payment is confirmed.
                </p>
              )}
            </div>
          ) : orderId ? (
            <div className="mt-8 rounded-xl border border-border/70 bg-card p-6">
              <p className="text-sm text-muted-foreground">Order reference</p>
              <p className="mt-1 font-mono text-lg font-semibold text-primary">{orderId}</p>
              {variant === 'success' && (
                <p className="mt-3 text-xs text-muted-foreground">
                  If confirmation takes a moment, your order will update automatically once
                  payment is confirmed.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading details…
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {bookingId && variant === 'success' && (
              <Link href={`/services/booking-confirmation?bookingId=${encodeURIComponent(bookingId)}`}>
                <Button size="lg">View booking</Button>
              </Link>
            )}
            {orderId && (variant === 'success' || variant === 'pending') && !bookingId && (
              <Link href={`/order-confirmation?orderId=${encodeURIComponent(orderId)}`}>
                <Button size="lg">{variant === 'pending' ? 'View order status' : 'View order'}</Button>
              </Link>
            )}
            {variant !== 'success' && variant !== 'pending' && (
              <Link href={isBooking ? '/services' : '/checkout'}>
                <Button size="lg">Try again</Button>
              </Link>
            )}
            <Link href={isBooking ? '/services' : '/shop'}>
              <Button size="lg" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {isBooking ? 'Back to services' : 'Continue shopping'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
