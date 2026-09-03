'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Clock, Loader2, MapPin } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import {
  PaymentStatusActions,
  PaymentStatusPanel,
  type PaymentLiveKind,
} from '@/components/payments/payment-status-panel';
import { getServiceBookingById } from '@/lib/firebase/service-bookings';
import type { ServiceBooking } from '@/lib/types/services';
import { useFeature } from '@/lib/feature-flags-context';

function giftSteps(paid: boolean): { label: string; state: 'done' | 'current' | 'todo' }[] {
  if (paid) {
    return [
      { label: 'Shared', state: 'done' },
      { label: 'Waiting', state: 'done' },
      { label: 'Paid', state: 'done' },
    ];
  }
  return [
    { label: 'Shared', state: 'done' },
    { label: 'Waiting', state: 'current' },
    { label: 'Paid', state: 'todo' },
  ];
}

function BookingConfirmationInner() {
  const searchParams = useSearchParams();
  const servicesEnabled = useFeature('services');
  const bookingId = searchParams.get('bookingId');
  const paymentParam = searchParams.get('payment');
  const giftQuery = searchParams.get('gift') === '1';
  const [booking, setBooking] = useState<ServiceBooking | null>(null);
  const [loading, setLoading] = useState(Boolean(bookingId));

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let intervalId: number | undefined;

    const load = async () => {
      const result = await getServiceBookingById(bookingId);
      if (cancelled) return;
      setBooking(result);
      setLoading(false);
      if (
        result?.paymentStatus === 'paid' ||
        result?.paymentStatus === 'failed' ||
        result?.paymentStatus === 'cancelled' ||
        result?.status === 'confirmed'
      ) {
        if (intervalId) window.clearInterval(intervalId);
      }
    };

    void load();
    intervalId = window.setInterval(() => {
      void load();
    }, 4000);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [bookingId]);

  const isGift = giftQuery || Boolean(booking?.sharedBookingToken);
  const paid =
    booking?.paymentStatus === 'paid' || booking?.status === 'confirmed';
  const failed =
    booking?.paymentStatus === 'failed' || booking?.paymentStatus === 'cancelled';
  const offline = paymentParam === 'offline';
  const catalogHref = servicesEnabled ? '/services' : '/shop';

  const view = useMemo(() => {
    if (offline) {
      return {
        kind: 'waiting' as PaymentLiveKind,
        title: 'Saved',
        detail: isGift ? 'We’ll confirm the gift payment.' : 'We’ll confirm payment.',
        live: false,
      };
    }
    if (failed) {
      return {
        kind: 'failed' as PaymentLiveKind,
        title: 'Failed',
        detail: isGift ? 'Gift payment did not go through.' : 'Payment did not go through.',
        live: false,
      };
    }
    if (paid) {
      return {
        kind: 'paid' as PaymentLiveKind,
        title: 'Paid',
        detail: isGift ? 'Gift received.' : 'Booking confirmed.',
        live: false,
      };
    }
    return {
      kind: 'waiting' as PaymentLiveKind,
      title: 'Waiting',
      detail: isGift ? 'Not paid yet.' : 'Approve on your phone.',
      live: true,
    };
  }, [failed, isGift, offline, paid]);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden py-12 px-4 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,oklch(0.74_0.12_62_/_0.16),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-lg space-y-6">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <PaymentStatusPanel
                kind={view.kind}
                title={view.title}
                detail={view.detail}
                amount={booking?.total ?? booking?.amount}
                reference={booking?.id ?? bookingId}
                gift={isGift}
                live={view.live}
                steps={isGift ? giftSteps(paid) : undefined}
                actions={
                  <PaymentStatusActions
                    primaryHref={catalogHref}
                    primaryLabel={servicesEnabled ? 'Services' : 'Shop'}
                    secondaryHref="/account"
                    secondaryLabel="Account"
                  />
                }
              />
              {booking ? (
                <div className="rounded-2xl border border-border/70 bg-card/90 p-5 text-left shadow-sm">
                  <p className="font-semibold tracking-tight">{booking.serviceName}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{booking.providerName}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {booking.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {booking.timeSlot}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {booking.locationType === 'mobile' ? 'Home visit' : 'Studio'}
                    </span>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}

export default function BookingConfirmationContent() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      }
    >
      <BookingConfirmationInner />
    </Suspense>
  );
}
