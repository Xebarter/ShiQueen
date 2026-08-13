'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { getServiceBookingById } from '@/lib/firebase/service-bookings';
import type { ServiceBooking } from '@/lib/types/services';
import { formatUGX } from '@/lib/wholesale-data';

function BookingConfirmationInner() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const paymentParam = searchParams.get('payment');
  const isGift = searchParams.get('gift') === '1';
  const paymentPending = paymentParam === 'pending';
  const paymentOffline = paymentParam === 'offline';
  const [booking, setBooking] = useState<ServiceBooking | null>(null);
  const [loading, setLoading] = useState(Boolean(bookingId));

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;

    const load = async () => {
      const result = await getServiceBookingById(bookingId);
      if (!cancelled) {
        setBooking(result);
        setLoading(false);
      }
    };

    load();
    const interval =
      paymentPending || booking?.paymentStatus === 'awaiting_payment'
        ? setInterval(load, 4000)
        : null;

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [bookingId, paymentPending, booking?.paymentStatus]);

  const paid =
    booking?.paymentStatus === 'paid' ||
    booking?.status === 'confirmed';

  return (
    <main>
      <Header />
      <section className="relative min-h-[calc(100vh-8rem)] overflow-hidden bg-gradient-to-b from-primary/[0.06] via-background to-background py-12 px-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-xl text-center">
          <div className="mb-8">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CheckCircle className="h-8 w-8" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              ShiQueen Services
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-brand)] text-3xl font-medium tracking-tight sm:text-4xl">
              {paymentOffline
                ? 'Booking received'
                : paymentPending || booking?.paymentStatus === 'awaiting_payment'
                  ? isGift
                    ? 'Waiting for payment'
                    : 'Approve on your phone'
                  : paid
                    ? 'Booking confirmed'
                    : 'Booking submitted'}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {paymentOffline
                ? 'Paytota was unavailable, but your booking is saved. Our team will contact you to complete mobile money payment.'
                : paymentPending || booking?.paymentStatus === 'awaiting_payment'
                  ? isGift
                    ? 'Share the payment link if you haven’t already. This page updates when payment clears.'
                    : 'Approve the Paytota prompt on your phone to complete payment and lock your slot.'
                  : paid
                    ? isGift
                      ? 'Payment received — the appointment is confirmed.'
                      : 'Your payment was received and the appointment is confirmed.'
                    : 'Your booking details are below.'}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/90 p-6 text-left shadow-sm backdrop-blur">
            <p className="text-sm text-muted-foreground">Booking reference</p>
            {loading ? (
              <Loader2 className="mt-2 h-6 w-6 animate-spin text-primary" />
            ) : (
              <p className="mt-1 font-mono text-xl font-semibold text-primary">
                {booking?.id ?? bookingId ?? '—'}
              </p>
            )}

            {booking && (
              <div className="mt-5 space-y-3 border-t border-border/60 pt-5 text-sm">
                <p className="text-lg font-semibold tracking-tight">{booking.serviceName}</p>
                <p className="text-muted-foreground">{booking.providerName}</p>
                <div className="flex flex-wrap gap-3 text-muted-foreground">
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
                    {booking.locationType === 'mobile' ? 'Home visit' : 'In studio'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatUGX(booking.total || booking.amount)}</span>
                </div>
                {booking.paymentStatus && (
                  <p className="text-xs capitalize text-muted-foreground">
                    Payment: {booking.paymentStatus.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/services">
              <Button size="lg" className="gap-2 rounded-xl">
                <Sparkles className="h-4 w-4" />
                Browse more services
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="rounded-xl">
                Contact support
              </Button>
            </Link>
          </div>
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
