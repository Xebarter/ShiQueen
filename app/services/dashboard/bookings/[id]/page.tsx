'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Play,
  Store,
  X,
} from 'lucide-react';
import { ProviderShell } from '@/components/provider/provider-shell';
import {
  PartnerCard,
  PartnerPage,
  PartnerPageHeader,
  PartnerStatusPill,
} from '@/components/partner/partner-page';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  getServiceBookingById,
  updateServiceBookingStatus,
} from '@/lib/firebase/service-bookings';
import type { ServiceBooking, ServiceBookingStatus } from '@/lib/types/services';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

const NEXT: Partial<Record<ServiceBookingStatus, ServiceBookingStatus>> = {
  pending: 'confirmed',
  confirmed: 'in_progress',
  in_progress: 'completed',
};

const NEXT_LABEL: Partial<Record<ServiceBookingStatus, string>> = {
  confirmed: 'Confirm',
  in_progress: 'Start',
  completed: 'Complete',
};

const STATUS_LABEL: Record<ServiceBookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'Live',
  completed: 'Done',
  cancelled: 'Cancelled',
};

function bookingTone(status: ServiceBookingStatus) {
  if (status === 'in_progress') return 'progress' as const;
  if (status === 'completed') return 'completed' as const;
  return status;
}

function formatDay(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-UG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(slot: string) {
  const match = slot.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return slot;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString('en-UG', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ProviderBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const { providerId } = useAuth();
  const [booking, setBooking] = useState<ServiceBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await getServiceBookingById(params.id);
      if (cancelled) return;
      if (!next || next.providerId !== providerId || next.paymentStatus !== 'paid') {
        setBooking(null);
      } else {
        setBooking(next);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, providerId]);

  const changeStatus = async (status: ServiceBookingStatus) => {
    if (!booking) return;
    setBusy(true);
    try {
      await updateServiceBookingStatus(booking.id, status);
      setBooking({ ...booking, status });
      toast.success(STATUS_LABEL[status]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <ProviderShell>
        <PartnerPage>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </PartnerPage>
      </ProviderShell>
    );
  }

  if (!booking) {
    return (
      <ProviderShell>
        <PartnerPage className="max-w-2xl">
          <Link
            href="/services/dashboard/bookings"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Bookings
          </Link>
          <p className="text-sm text-muted-foreground">Booking not found.</p>
        </PartnerPage>
      </ProviderShell>
    );
  }

  const nextStatus = NEXT[booking.status];
  const mobile = booking.locationType === 'mobile';
  const canCancel =
    booking.status !== 'cancelled' &&
    booking.status !== 'completed' &&
    booking.paymentStatus !== 'paid';

  return (
    <ProviderShell>
      <PartnerPage className="max-w-2xl">
        <Link
          href="/services/dashboard/bookings"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Bookings
        </Link>

        <PartnerPageHeader
          title={booking.serviceName}
          action={
            <PartnerStatusPill tone={bookingTone(booking.status)}>
              {STATUS_LABEL[booking.status]}
            </PartnerStatusPill>
          }
        />

        <PartnerCard className="mb-4 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/[0.08] via-card to-card px-5 py-6 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Appointment
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {formatTime(booking.timeSlot)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{formatDay(booking.date)}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium">
                {mobile ? <MapPin className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                {mobile ? 'Mobile' : 'Studio'}
              </span>
              <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold tabular-nums">
                {formatUGX(booking.total)}
              </span>
              {booking.paymentStatus ? (
                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs capitalize text-muted-foreground">
                  {booking.paymentStatus}
                  {booking.paymentMethod ? ` · ${booking.paymentMethod}` : ''}
                </span>
              ) : null}
            </div>
          </div>
        </PartnerCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <PartnerCard className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Client
            </p>
            <p className="mt-2 text-base font-semibold tracking-tight">{booking.customerName}</p>

            <div className="mt-4 space-y-2">
              {booking.customerPhone ? (
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm transition hover:bg-muted/40"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate font-medium">{booking.customerPhone}</span>
                </a>
              ) : null}
              {booking.customerEmail ? (
                <a
                  href={`mailto:${booking.customerEmail}`}
                  className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm transition hover:bg-muted/40"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{booking.customerEmail}</span>
                </a>
              ) : null}
            </div>
          </PartnerCard>

          <PartnerCard className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Location
            </p>
            {booking.customerAddress ? (
              <p className="mt-2 text-sm leading-relaxed">{booking.customerAddress}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {mobile ? 'Address not provided' : 'In studio'}
              </p>
            )}
            {booking.notes ? (
              <div className="mt-4 border-t border-border/60 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Notes
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">{booking.notes}</p>
              </div>
            ) : null}
          </PartnerCard>
        </div>

        {(nextStatus || canCancel) && (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {nextStatus ? (
              <Button
                disabled={busy}
                className="h-11 flex-1 rounded-full sm:flex-none sm:min-w-[9.5rem]"
                onClick={() => changeStatus(nextStatus)}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : nextStatus === 'confirmed' ? (
                  <Check className="h-4 w-4" />
                ) : nextStatus === 'in_progress' ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {NEXT_LABEL[nextStatus]}
              </Button>
            ) : null}

            {canCancel ? (
              <Button
                variant="outline"
                disabled={busy}
                className={cn(
                  'h-11 flex-1 rounded-full sm:flex-none',
                  'border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800'
                )}
                onClick={() => changeStatus('cancelled')}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            ) : null}
          </div>
        )}
      </PartnerPage>
    </ProviderShell>
  );
}
