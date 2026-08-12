'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Gift,
  Loader2,
  MapPin,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSharedBookingById, markSharedBookingPaid } from '@/lib/firebase/shared-bookings';
import { createServiceBooking, updateServiceBooking } from '@/lib/firebase/service-bookings';
import { toSharedBookingPublicView } from '@/lib/shared-booking-utils';
import type { SharedBooking, SharedBookingPublicView } from '@/lib/types/shared-booking';
import { formatUGX } from '@/lib/wholesale-data';

const fieldClass =
  'h-12 rounded-xl border-border/80 bg-background px-4 text-base shadow-sm transition-all placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/10 md:text-base';

interface SharedBookingPayPageProps {
  token: string;
}

export function SharedBookingPayPage({ token }: SharedBookingPayPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [view, setView] = useState<SharedBookingPublicView | null>(null);
  const [sharedData, setSharedData] = useState<SharedBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/services/book/share/${encodeURIComponent(token)}`);
      const data = await response.json();

      if (data.requiresClientRead) {
        const stored = await getSharedBookingById(token);
        if (!stored) throw new Error('Payment link not found.');
        setSharedData(stored);
        setView(toSharedBookingPublicView(stored));
        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? 'Payment link not found.');
      }

      setSharedData(null);
      setView(data as SharedBookingPublicView);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment link.');
      setView(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!view || view.status !== 'pending') return;

    setPaying(true);
    try {
      const response = await fetch(`/api/services/book/share/${encodeURIComponent(token)}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          clientShared: sharedData
            ? {
                bookingId: sharedData.bookingId,
                snapshot: sharedData.snapshot,
                senderUserId: sharedData.senderUserId ?? null,
              }
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyPaid && data.bookingId) {
          toast.success('This booking is already paid.');
          router.push(
            `/services/booking-confirmation?bookingId=${encodeURIComponent(data.bookingId)}&gift=1`
          );
          return;
        }
        throw new Error(data.error ?? 'Failed to start payment.');
      }

      if (data.requiresClientBooking && data.booking) {
        const existing = data.booking.id
          ? await import('@/lib/firebase/service-bookings').then((m) =>
              m.getServiceBookingById(data.booking.id)
            )
          : null;
        if (existing) {
          await updateServiceBooking(data.booking.id, {
            paymentStatus: data.booking.paymentStatus,
            paytotaPurchaseId: data.booking.paytotaPurchaseId,
            paytotaReference: data.booking.paytotaReference,
            status: data.booking.status,
          });
        } else {
          await createServiceBooking(data.booking);
        }
      }

      if (data.markSharedBookingPaid && data.bookingId) {
        await markSharedBookingPaid(token, data.bookingId as string);
      }

      if (data.stk?.status === 'pending' && data.bookingId) {
        toast.success(data.stk.details?.message ?? 'Check your phone to approve the payment.');
        router.push(
          `/services/booking-confirmation?bookingId=${encodeURIComponent(data.bookingId)}&payment=pending&gift=1`
        );
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.returnUrl) {
        router.push(data.returnUrl);
        return;
      }

      throw new Error('No payment method available. Please try again.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start payment.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-accent/[0.08] via-background to-background">
      <Header />
      <section className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error || !view ? (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
            <p className="text-lg font-semibold">Payment link unavailable</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {error ?? 'This link could not be found.'}
            </p>
            <Link href="/services" className="mt-6 inline-block">
              <Button className="rounded-xl">Browse services</Button>
            </Link>
          </div>
        ) : view.status === 'paid' ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-card p-8 text-center">
            <p className="text-lg font-semibold text-emerald-700">Already paid</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This booking for {view.recipientFirstName} is already confirmed.
            </p>
            <Link
              href={`/services/booking-confirmation?bookingId=${encodeURIComponent(view.bookingId)}&gift=1`}
              className="mt-6 inline-block"
            >
              <Button className="rounded-xl">View confirmation</Button>
            </Link>
          </div>
        ) : view.status === 'expired' ? (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
            <p className="text-lg font-semibold">Link expired</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask {view.recipientFirstName} to create a new payment link from their booking.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border-2 border-accent/35 bg-gradient-to-br from-accent/15 via-card to-card shadow-lg shadow-accent/10">
              <div className="border-b border-accent/20 bg-accent/10 px-6 py-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/30 text-accent-foreground">
                    <Gift className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground/80">
                      You&apos;re covering this booking
                    </p>
                    <h1 className="mt-1 font-[family-name:var(--font-brand)] text-2xl font-medium tracking-tight sm:text-3xl">
                      Pay for {view.recipientFirstName}&apos;s appointment
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      They booked on SheQueen. Enter your mobile money details below to complete
                      payment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Service
                  </p>
                  <p className="mt-1 text-lg font-semibold">{view.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{view.providerName}</p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {view.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1">
                    <Clock className="h-3.5 w-3.5" />
                    {view.timeSlot}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {view.locationLabel}
                  </span>
                </div>

                {view.senderMessage && (
                  <blockquote className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm italic text-muted-foreground">
                    “{view.senderMessage}”
                  </blockquote>
                )}

                <div className="rounded-2xl bg-primary/8 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Amount to pay
                  </p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-primary">
                    {formatUGX(view.total)}
                  </p>
                  {view.travelFee > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Includes {formatUGX(view.travelFee)} travel fee
                    </p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4 rounded-2xl border border-border/70 bg-card p-6">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Your mobile money details</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                We&apos;ll send an STK push to this number. You are the payer — the booking stays
                under {view.recipientFirstName}&apos;s name.
              </p>

              <div className="space-y-2">
                <Label htmlFor="payer-name">Your full name</Label>
                <Input
                  id="payer-name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer-email">Your email</Label>
                <Input
                  id="payer-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer-phone">Mobile money phone</Label>
                <Input
                  id="payer-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="07XX XXX XXX"
                  className={fieldClass}
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full gap-2 rounded-xl text-base font-semibold"
                disabled={paying}
              >
                {paying ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                Pay {formatUGX(view.total)} now
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Link valid until {new Date(view.expiresAt).toLocaleString()}
              </p>
            </form>

            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to services
            </Link>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
