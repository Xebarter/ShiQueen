'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { ChevronRight, ClipboardList, MapPin, Store } from 'lucide-react';
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
  { id: 'in_progress', label: 'Live' },
  { id: 'completed', label: 'Done' },
  { id: 'cancelled', label: 'Cancelled' },
];

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

function toDateKey(value: string) {
  return value.slice(0, 10);
}

function addDaysIso(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayHeading(date: string, today: string, tomorrow: string) {
  if (date === today) return 'Today';
  if (date === tomorrow) return 'Tomorrow';
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-UG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(slot: string) {
  const match = slot.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return slot;
  const hours = Number(match[1]);
  const minutes = match[2];
  const date = new Date();
  date.setHours(hours, Number(minutes), 0, 0);
  return date.toLocaleTimeString('en-UG', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function compareBookings(a: ServiceBooking, b: ServiceBooking) {
  const dateCmp = toDateKey(a.date).localeCompare(toDateKey(b.date));
  if (dateCmp !== 0) return dateCmp;
  return a.timeSlot.localeCompare(b.timeSlot);
}

export default function ProviderBookingsPage() {
  const { providerId } = useAuth();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  useEffect(() => {
    if (!providerId) return;
    return subscribeServiceBookingsForProvider(providerId, setBookings);
  }, [providerId]);

  const today = useMemo(() => addDaysIso(new Date(), 0), []);
  const tomorrow = useMemo(() => addDaysIso(new Date(), 1), []);

  const counts = useMemo(() => {
    const next: Record<string, number> = { all: bookings.length };
    for (const booking of bookings) {
      next[booking.status] = (next[booking.status] ?? 0) + 1;
    }
    return next;
  }, [bookings]);

  const visible = useMemo(() => {
    const list = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
    return [...list].sort(compareBookings);
  }, [bookings, filter]);

  const groups = useMemo(() => {
    const map = new Map<string, ServiceBooking[]>();
    for (const booking of visible) {
      const key = toDateKey(booking.date);
      const bucket = map.get(key);
      if (bucket) bucket.push(booking);
      else map.set(key, [booking]);
    }
    return [...map.entries()];
  }, [visible]);

  const pendingCount = counts.pending ?? 0;
  const todayCount = useMemo(
    () => bookings.filter((b) => toDateKey(b.date) === today && b.status !== 'cancelled').length,
    [bookings, today]
  );

  return (
    <ProviderShell>
      <PartnerPage className="max-w-3xl">
        <PartnerPageHeader
          title="Bookings"
          action={
            bookings.length > 0 ? (
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Today
                  </p>
                  <p className="text-lg font-bold tabular-nums leading-none">{todayCount}</p>
                </div>
                <div className="h-8 w-px bg-border/70" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Pending
                  </p>
                  <p className="text-lg font-bold tabular-nums leading-none">{pendingCount}</p>
                </div>
              </div>
            ) : null
          }
        />

        <Suspense fallback={null}>
          <InstallWelcomeCard appName="ShiQueen Services" />
        </Suspense>

        {bookings.length > 0 ? (
          <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
            <div className="inline-flex min-w-full gap-1 rounded-2xl border border-border/60 bg-card/90 p-1 shadow-sm sm:min-w-0 sm:flex-wrap">
              {FILTERS.map((item) => {
                const count = counts[item.id] ?? 0;
                if (item.id !== 'all' && count === 0) return null;
                const active = filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                        active ? 'bg-white/20' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <PartnerEmptyState
            icon={ClipboardList}
            title={bookings.length === 0 ? 'No bookings yet' : 'Nothing here'}
            description={
              bookings.length === 0
                ? 'New appointments will show up in this queue.'
                : 'Try another filter.'
            }
          />
        ) : (
          <div className="space-y-5">
            {groups.map(([date, items]) => (
              <section key={date}>
                <div className="mb-2 flex items-baseline justify-between gap-3 px-0.5">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {dayHeading(date, today, tomorrow)}
                  </h2>
                  <span className="text-[11px] tabular-nums text-muted-foreground/80">
                    {items.length}
                  </span>
                </div>

                <PartnerCard className="divide-y divide-border/50 overflow-hidden">
                  {items.map((booking) => {
                    const mobile = booking.locationType === 'mobile';
                    return (
                      <Link
                        key={booking.id}
                        href={`/services/dashboard/bookings/${booking.id}`}
                        className="group flex items-stretch gap-0 transition hover:bg-muted/35"
                      >
                        <div className="flex w-[4.75rem] shrink-0 flex-col items-center justify-center border-r border-border/50 bg-gradient-to-b from-primary/[0.06] to-transparent px-2 py-4 sm:w-24">
                          <span className="text-sm font-bold tabular-nums tracking-tight sm:text-base">
                            {formatTime(booking.timeSlot)}
                          </span>
                        </div>

                        <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3.5 sm:px-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="truncate text-sm font-semibold tracking-tight sm:text-[15px]">
                                {booking.serviceName}
                              </p>
                              <PartnerStatusPill tone={bookingTone(booking.status)}>
                                {STATUS_LABEL[booking.status]}
                              </PartnerStatusPill>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                              <span className="truncate font-medium text-foreground/80">
                                {booking.customerName}
                              </span>
                              <span className="text-border">·</span>
                              <span className="inline-flex items-center gap-1">
                                {mobile ? (
                                  <MapPin className="h-3 w-3" />
                                ) : (
                                  <Store className="h-3 w-3" />
                                )}
                                {mobile ? 'Mobile' : 'Studio'}
                              </span>
                            </div>

                            <p className="mt-2 text-sm font-semibold tabular-nums tracking-tight">
                              {formatUGX(booking.total)}
                            </p>
                          </div>

                          <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-muted-foreground sm:block" />
                        </div>
                      </Link>
                    );
                  })}
                </PartnerCard>
              </section>
            ))}
          </div>
        )}
      </PartnerPage>
    </ProviderShell>
  );
}
