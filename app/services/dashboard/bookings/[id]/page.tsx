'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
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

const NEXT: Partial<Record<ServiceBookingStatus, ServiceBookingStatus>> = {
  pending: 'confirmed',
  confirmed: 'in_progress',
  in_progress: 'completed',
};

function bookingTone(status: ServiceBookingStatus) {
  if (status === 'in_progress') return 'progress' as const;
  return status;
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
      if (!next || next.providerId !== providerId) {
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
      toast.success(`Marked ${status.replace('_', ' ')}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update booking');
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
        <PartnerPage>
          <p className="text-sm text-muted-foreground">Booking not found.</p>
        </PartnerPage>
      </ProviderShell>
    );
  }

  const nextStatus = NEXT[booking.status];

  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Booking"
          title={booking.serviceName}
          description={`${booking.date} at ${booking.timeSlot} · ${booking.locationType}`}
          action={
            <PartnerStatusPill tone={bookingTone(booking.status)}>
              {booking.status.replace('_', ' ')}
            </PartnerStatusPill>
          }
        />

        <PartnerCard className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Customer
            </p>
            <p className="mt-2 font-medium">{booking.customerName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{booking.customerPhone}</p>
            {booking.customerEmail && (
              <p className="text-sm text-muted-foreground">{booking.customerEmail}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Payment
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {formatUGX(booking.total)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {booking.paymentStatus ?? 'unknown'} · {booking.paymentMethod ?? '—'}
            </p>
          </div>
          {booking.customerAddress && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Address
              </p>
              <p className="mt-2 text-sm leading-relaxed">{booking.customerAddress}</p>
            </div>
          )}
          {booking.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p className="mt-2 text-sm leading-relaxed">{booking.notes}</p>
            </div>
          )}
        </PartnerCard>

        <div className="mt-6 flex flex-wrap gap-2">
          {nextStatus && (
            <Button disabled={busy} onClick={() => changeStatus(nextStatus)}>
              Mark {nextStatus.replace('_', ' ')}
            </Button>
          )}
          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => changeStatus('cancelled')}
            >
              Cancel
            </Button>
          )}
        </div>
      </PartnerPage>
    </ProviderShell>
  );
}
