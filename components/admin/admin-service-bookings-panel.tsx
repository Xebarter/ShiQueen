'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Scissors,
  Search,
  Sparkles,
  Store,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminBookingDialog, formatAppointmentDay, formatAppointmentTime } from '@/components/admin/admin-booking-dialog';
import { subscribeServiceBookings, updateServiceBookingStatus } from '@/lib/firebase/service-bookings';
import { PAYMENT_METHOD_LABELS } from '@/lib/payments/labels';
import type { PaymentStatus } from '@/lib/types/database';
import type { ServiceBooking, ServiceBookingStatus } from '@/lib/types/services';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = ['All', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;

const BOOKING_STATUS: Record<ServiceBookingStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-800 ring-amber-500/20' },
  confirmed: { label: 'Confirmed', className: 'bg-sky-500/10 text-sky-800 ring-sky-500/20' },
  in_progress: { label: 'In session', className: 'bg-violet-500/10 text-violet-800 ring-violet-500/20' },
  completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-800 ring-emerald-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-500/10 text-rose-800 ring-rose-500/20' },
};

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  awaiting_payment: {
    label: 'Awaiting payment',
    className: 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/10 text-red-700 ring-red-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-500/10 text-slate-700 ring-slate-500/20',
  },
  cod_pending: {
    label: 'COD pending',
    className: 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
  },
};

const STRIP_TONES = [
  {
    strip: 'border-primary/20 bg-[#F7F1F5] hover:border-primary/35 hover:bg-[#F3EAF1]',
    divider: 'border-primary/10',
  },
  {
    strip: 'border-rose-200/80 bg-[#FBF1F4] hover:border-rose-300/80 hover:bg-[#F7E8ED]',
    divider: 'border-rose-900/8',
  },
  {
    strip: 'border-amber-200/70 bg-[#FBF6EE] hover:border-amber-300/80 hover:bg-[#F8F0E4]',
    divider: 'border-amber-900/8',
  },
  {
    strip: 'border-violet-200/70 bg-[#F4F1FA] hover:border-violet-300/80 hover:bg-[#EEE9F7]',
    divider: 'border-violet-900/8',
  },
  {
    strip: 'border-slate-200/80 bg-[#F4F6F8] hover:border-slate-300/80 hover:bg-[#EEF1F4]',
    divider: 'border-slate-900/8',
  },
] as const;

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calendarParts(date: string) {
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { weekday: '—', day: date.slice(-2) || '—', month: '' };
  }
  return {
    weekday: new Intl.DateTimeFormat('en-UG', { weekday: 'short' }).format(parsed),
    day: new Intl.DateTimeFormat('en-UG', { day: 'numeric' }).format(parsed),
    month: new Intl.DateTimeFormat('en-UG', { month: 'short' }).format(parsed),
  };
}

function bookingScheduleKey(booking: ServiceBooking) {
  return `${booking.date}T${booking.timeSlot}`;
}

function isUpcomingBooking(booking: ServiceBooking, today: string) {
  return booking.date >= today && booking.status !== 'completed' && booking.status !== 'cancelled';
}

function formatBookingRef(id: string): string {
  if (id.length <= 12) return id.toUpperCase();
  return `#${id.slice(-8).toUpperCase()}`;
}

function StatusBadge({ status }: { status: ServiceBookingStatus }) {
  const config = BOOKING_STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function PaymentBadge({ status }: { status?: PaymentStatus }) {
  if (!status) return null;
  const config = PAYMENT_STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof CalendarDays;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold tabular-nums', accent)}>{value}</p>
        </div>
        <span className={cn('rounded-lg bg-muted p-2', accent)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function BookingStrip({
  booking,
  toneIndex,
  onOpen,
  onUpdateStatus,
}: {
  booking: ServiceBooking;
  toneIndex: number;
  onOpen: (id: string) => void;
  onUpdateStatus: (id: string, status: ServiceBookingStatus) => void;
}) {
  const tone = STRIP_TONES[toneIndex % STRIP_TONES.length];
  const cal = calendarParts(booking.date);
  const paid = booking.paymentStatus === 'paid';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(booking.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(booking.id);
        }
      }}
      className={cn(
        'group relative overflow-hidden rounded-xl border text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        'transition-[border-color,box-shadow,background-color] duration-150',
        'hover:shadow-[0_2px_10px_rgba(15,23,42,0.06)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        tone.strip
      )}
    >
      <div className="flex min-w-0 flex-col gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5 lg:flex-row lg:items-center lg:gap-5">
        <div className="flex items-center gap-3 lg:w-[9.5rem] lg:shrink-0">
          <div className="flex h-[4.35rem] w-[4.1rem] flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
              {cal.weekday}
            </span>
            <span className="text-[1.65rem] font-semibold leading-none">{cal.day}</span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider opacity-80">
              {cal.month}
            </span>
          </div>
          <div className="min-w-0 lg:hidden">
            <p className="text-sm font-semibold">{formatAppointmentTime(booking.timeSlot)}</p>
            <p className="truncate text-xs text-muted-foreground">{formatAppointmentDay(booking.date)}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="hidden text-[10px] font-semibold uppercase tracking-wider text-muted-foreground lg:block">
            {formatAppointmentTime(booking.timeSlot)}
          </p>
          <p className="truncate font-[family-name:var(--font-brand)] text-base font-medium tracking-tight">
            {booking.serviceName || 'Service booking'}
          </p>
          <p className="mt-0.5 truncate text-sm text-foreground/80">{booking.providerName || 'Unassigned provider'}</p>
          <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
            {booking.date === todayKey() ? (
              <span className="mr-0.5 rounded-full bg-primary/12 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-primary">
                Today
              </span>
            ) : null}
            {booking.locationType === 'mobile' ? (
              <MapPin className="h-3 w-3" />
            ) : (
              <Store className="h-3 w-3" />
            )}
            {booking.locationType === 'mobile' ? 'Mobile visit' : 'In studio'}
            <span className="text-border">·</span>
            <span className="font-mono">{formatBookingRef(booking.id)}</span>
          </p>
        </div>

        <div className={cn('min-w-0 flex-1 border-t pt-3 lg:border-t-0 lg:border-l lg:px-5 lg:pt-0', tone.divider)}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Client</p>
          <p className="mt-0.5 truncate text-sm font-medium">{booking.customerName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {booking.customerPhone || booking.customerEmail || 'No contact'}
          </p>
        </div>

        <div
          className={cn(
            'flex flex-wrap items-center gap-2 border-t pt-3 lg:w-[13rem] lg:shrink-0 lg:flex-col lg:items-start lg:border-t-0 lg:border-l lg:px-5 lg:pt-0',
            tone.divider
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={booking.status} />
            <PaymentBadge status={booking.paymentStatus} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {booking.paymentMethod ? PAYMENT_METHOD_LABELS[booking.paymentMethod] : 'Payment n/a'}
          </p>
        </div>

        <div
          className={cn(
            'flex items-end justify-between gap-3 border-t pt-3 lg:w-[11.5rem] lg:shrink-0 lg:flex-col lg:items-end lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0',
            tone.divider
          )}
        >
          <div className="text-left lg:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-base font-semibold tabular-nums tracking-tight">
              {formatUGX(booking.total || booking.amount)}
            </p>
          </div>
          <div
            className="flex items-center gap-2"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <select
              value={booking.status}
              aria-label={`Update status for ${booking.serviceName}`}
              onChange={(event) =>
                onUpdateStatus(booking.id, event.target.value as ServiceBookingStatus)
              }
              className="h-8 rounded-md border border-border/80 bg-background px-2 text-xs capitalize shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {(Object.keys(BOOKING_STATUS) as ServiceBookingStatus[]).map((status) => (
                <option key={status} value={status} disabled={status === 'cancelled' && paid}>
                  {BOOKING_STATUS[status].label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              className="hidden h-8 shrink-0 border-border/70 bg-white/70 backdrop-blur-sm sm:inline-flex"
              onClick={() => onOpen(booking.id)}
            >
              Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type AdminServiceBookingsPanelProps = {
  selectedBookingId: string | null;
  onSelectBooking: (id: string | null) => void;
};

export function AdminServiceBookingsPanel({
  selectedBookingId,
  onSelectBooking,
}: AdminServiceBookingsPanelProps) {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    return subscribeServiceBookings(
      (next) => {
        setBookings(next);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to load service bookings');
        setLoading(false);
      }
    );
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const today = todayKey();
    return bookings
      .filter((booking) => {
        const matchesSearch =
          !term ||
          booking.id.toLowerCase().includes(term) ||
          booking.customerName.toLowerCase().includes(term) ||
          (booking.customerPhone ?? '').toLowerCase().includes(term) ||
          (booking.customerEmail ?? '').toLowerCase().includes(term) ||
          booking.serviceName.toLowerCase().includes(term) ||
          booking.providerName.toLowerCase().includes(term) ||
          formatBookingRef(booking.id).toLowerCase().includes(term);
        const matchesStatus = filterStatus === 'All' || booking.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aUp = isUpcomingBooking(a, today);
        const bUp = isUpcomingBooking(b, today);
        if (aUp !== bUp) return aUp ? -1 : 1;
        const cmp = bookingScheduleKey(a).localeCompare(bookingScheduleKey(b));
        return aUp ? cmp : -cmp;
      });
  }, [bookings, searchTerm, filterStatus]);

  const selected = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) ?? null,
    [bookings, selectedBookingId]
  );

  const stats = useMemo(() => {
    const today = todayKey();
    const live = bookings.filter((booking) => booking.status !== 'cancelled');
    return {
      total: bookings.length,
      upcoming: live.filter(
        (booking) => booking.date >= today && booking.status !== 'completed'
      ).length,
      inSession: bookings.filter((booking) => booking.status === 'in_progress').length,
      revenue: live
        .filter((booking) => booking.paymentStatus === 'paid' || booking.status === 'completed')
        .reduce((sum, booking) => sum + (booking.total || booking.amount), 0),
    };
  }, [bookings]);

  const handleStatusUpdate = async (id: string, status: ServiceBookingStatus) => {
    try {
      await updateServiceBookingStatus(id, status);
      toast.success(`Booking updated to ${BOOKING_STATUS[status].label.toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update booking');
    }
  };

  return (
    <>
      {!loading && bookings.length > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard label="All bookings" value={stats.total} icon={Scissors} accent="text-foreground" />
          <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarDays} accent="text-primary" />
          <StatCard label="In session" value={stats.inSession} icon={Sparkles} accent="text-violet-600" />
          <StatCard label="Collected" value={formatUGX(stats.revenue)} icon={Wallet} accent="text-emerald-600" />
        </div>
      ) : null}

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/10">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg font-light tracking-tight">Appointment desk</CardTitle>
                <CardDescription>
                  {loading
                    ? 'Loading bookings…'
                    : `${filtered.length} of ${bookings.length} service bookings · upcoming first`}
                </CardDescription>
              </div>
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search client, service, provider…"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
              {STATUS_FILTERS.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="h-8 w-full min-w-0 px-1.5 text-[11px] capitalize sm:px-2 sm:text-xs"
                >
                  <span className="truncate">
                    {status === 'in_progress' ? 'In session' : status}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="bg-muted/15 p-3 sm:p-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-card px-6 py-14 text-center">
              <Clock className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">
                {bookings.length === 0 ? 'No service bookings yet' : 'No matching bookings'}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {bookings.length === 0
                  ? 'Beauty, hair, and salon bookings from the storefront will appear here — separate from shop orders.'
                  : 'Try a different search or status filter.'}
              </p>
              {bookings.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('All');
                  }}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((booking, index) => (
                <BookingStrip
                  key={booking.id}
                  booking={booking}
                  toneIndex={index}
                  onOpen={onSelectBooking}
                  onUpdateStatus={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AdminBookingDialog booking={selected} onClose={() => onSelectBooking(null)} />
    </>
  );
}

export function useServiceBookingCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    return subscribeServiceBookings((next) => setCount(next.length));
  }, []);
  return count;
}
