'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, ClipboardList, Plus, Scissors, Star } from 'lucide-react';
import { ProviderShell } from '@/components/provider/provider-shell';
import { ApprovedActionLink } from '@/components/partner/approved-action-link';
import {
  PartnerCard,
  PartnerPage,
  PartnerSectionLabel,
  PartnerStatCard,
  PartnerStatusPill,
} from '@/components/partner/partner-page';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';
import { subscribeServiceBookingsForProvider } from '@/lib/firebase/service-bookings';
import type { ServiceBooking } from '@/lib/types/services';
import { canListCatalog } from '@/lib/partner-status';
import { formatUGX } from '@/lib/wholesale-data';

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function bookingTone(status: ServiceBooking['status']) {
  if (status === 'in_progress') return 'progress' as const;
  return status;
}

export default function ProviderDashboardPage() {
  const { providerId } = useAuth();
  const { providers, listings } = useServices();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);

  const provider = providers.find((p) => p.id === providerId);
  const allowed = canListCatalog(provider?.approvalStatus, provider?.isActive);

  const mine = useMemo(
    () => listings.filter((l) => l.providerId === providerId && !l.isArchived),
    [listings, providerId]
  );

  useEffect(() => {
    if (!providerId) return;
    return subscribeServiceBookingsForProvider(providerId, setBookings);
  }, [providerId]);

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const bookingsThisWeek = bookings.filter((b) => b.createdAt >= weekStart);
  const completed = bookings.filter((b) => b.status === 'completed');
  const earnings = completed.reduce((sum, b) => sum + b.total, 0);
  const recent = bookings.slice(0, 5);
  const greeting = greetingForHour(new Date().getHours());

  return (
    <ProviderShell>
      <PartnerPage>
        <div className="mb-8 rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Insights
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {greeting}
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {[provider?.businessName || 'Your studio', provider?.city].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 md:items-end">
              <div className="text-left md:text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Completed earnings
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
                  {formatUGX(earnings)}
                </p>
              </div>
              <ApprovedActionLink
                allowed={allowed}
                href="/services/dashboard/listings/new"
              >
                <Plus className="h-4 w-4" />
                Add listing
              </ApprovedActionLink>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PartnerStatCard
            label="Listings"
            value={mine.length}
            href="/services/dashboard/listings"
            icon={Scissors}
            tone="rose"
          />
          <PartnerStatCard
            label="This week"
            value={bookingsThisWeek.length}
            href="/services/dashboard/bookings"
            icon={ClipboardList}
            tone="gold"
          />
          <PartnerStatCard
            label="Completed"
            value={completed.length}
            href="/services/dashboard/bookings"
            icon={CalendarClock}
            tone="sage"
          />
          <PartnerStatCard
            label="Rating"
            value={provider?.rating?.toFixed(1) ?? '—'}
            href="/services/dashboard/reviews"
            icon={Star}
            tone="plum"
          />
        </div>

        {recent.length > 0 && (
          <section>
            <PartnerSectionLabel>Recent bookings</PartnerSectionLabel>
            <PartnerCard>
              {recent.map((booking) => (
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
                  <PartnerStatusPill tone={bookingTone(booking.status)}>
                    {booking.status.replace('_', ' ')}
                  </PartnerStatusPill>
                </Link>
              ))}
            </PartnerCard>
          </section>
        )}
      </PartnerPage>
    </ProviderShell>
  );
}
