'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import {
  PaymentStatusActions,
  PaymentStatusPanel,
  type PaymentLiveKind,
} from '@/components/payments/payment-status-panel';
import { useCart } from '@/lib/cart-context';

type PaymentResultVariant = 'success' | 'failure' | 'cancel' | 'pending';

const KIND: Record<PaymentResultVariant, PaymentLiveKind> = {
  success: 'paid',
  pending: 'waiting',
  failure: 'failed',
  cancel: 'failed',
};

export function PaymentResultPage({ variant }: { variant: PaymentResultVariant }) {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const bookingId = searchParams.get('bookingId');
  const isGift = searchParams.get('gift') === '1';
  const isBooking = Boolean(bookingId);
  const { clearCart } = useCart();

  useEffect(() => {
    if (variant === 'success' || variant === 'pending') {
      if (!isBooking && !isGift) clearCart();
    }
  }, [clearCart, isBooking, isGift, variant]);

  const title =
    variant === 'success'
      ? 'Paid'
      : variant === 'pending'
        ? 'Waiting'
        : variant === 'cancel'
          ? 'Cancelled'
          : 'Failed';

  const detail =
    variant === 'success'
      ? isGift
        ? 'Gift received.'
        : isBooking
          ? 'Booking confirmed.'
          : 'Order confirmed.'
      : variant === 'pending'
        ? isGift
          ? 'Not paid yet.'
          : 'Confirming card payment.'
        : variant === 'cancel'
          ? isGift
            ? 'Gift not paid.'
            : 'Not charged.'
          : isGift
            ? 'Gift payment did not go through.'
            : 'Payment did not go through.';

  const confirmHref = bookingId
    ? `/services/booking-confirmation?bookingId=${encodeURIComponent(bookingId)}${isGift ? '&gift=1' : ''}`
    : orderId
      ? `/order-confirmation?orderId=${encodeURIComponent(orderId)}${isGift ? '&gift=1' : ''}`
      : isBooking
        ? '/services'
        : '/shop';

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden py-12 px-4 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,oklch(0.74_0.12_62_/_0.16),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-lg">
          <PaymentStatusPanel
            kind={KIND[variant]}
            title={title}
            detail={detail}
            reference={bookingId ?? orderId}
            gift={isGift}
            live={variant === 'pending'}
            actions={
              <PaymentStatusActions
                primaryHref={
                  variant === 'success' || variant === 'pending' ? confirmHref : isBooking ? '/services' : '/checkout'
                }
                primaryLabel={
                  variant === 'pending'
                    ? 'Status'
                    : variant === 'success'
                      ? isBooking
                        ? 'Booking'
                        : 'Order'
                      : 'Try again'
                }
                secondaryHref={isBooking ? '/services' : '/shop'}
                secondaryLabel={isBooking ? 'Services' : 'Shop'}
              />
            }
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
