'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { ProviderShell } from '@/components/provider/provider-shell';
import {
  PartnerCard,
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
  PartnerStatusPill,
} from '@/components/partner/partner-page';
import { useAuth } from '@/lib/auth-context';
import { subscribeServiceBookingsForProvider } from '@/lib/firebase/service-bookings';
import type { ServiceBooking, ServiceBookingStatus } from '@/lib/types/services';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';
import { InstallWelcomeCard } from '@/components/pwa/install-welcome-card';

const FILTERS: Array<{ id: 'all' | ServiceBookingStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function bookingTone(status: ServiceBookingStatus) {
  if (status === 'in_progress') return 'progress' as const;
  return status;
}

export default function ProviderBookingsPage() {
  const { providerId } = useAuth();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  useEffect(() => {
    if (!providerId) return;
    return subscribeServiceBookingsForProvider(providerId, setBookings);
  }, [providerId]);

  const visible = useMemo(
    () => (filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );

  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Studio"
          title="Bookings"
          description="Confirm, start, and complete appointments with a calm, clear queue."
        />
        <Suspense fallback={null}>
          <InstallWelcomeCard appName="ShiQueen Services" />
        </Suspense>
        <div className="mb-5 flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition',
                filter === item.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background text-muted-foreground ring-1 ring-inset ring-border hover:bg-secondary'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <PartnerEmptyState
            icon={ClipboardList}
            title="No bookings"
            description="When customers book your listings, they will appear here."
          />
        ) : (
          <PartnerCard>
            {visible.map((booking) => (
              <Link
                key={booking.id}
                href={`/services/dashboard/bookings/${booking.id}`}
                className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0 transition hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{booking.serviceName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {booking.customerName} · {booking.date} {booking.timeSlot}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatUGX(booking.total)}</p>
                  <div className="mt-1.5">
                    <PartnerStatusPill tone={bookingTone(booking.status)}>
                      {booking.status.replace('_', ' ')}
                    </PartnerStatusPill>
                  </div>
                </div>
              </Link>
            ))}
          </PartnerCard>
        )}
      </PartnerPage>
    </ProviderShell>
  );
}
