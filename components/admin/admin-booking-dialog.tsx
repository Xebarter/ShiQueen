'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  Copy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Scissors,
  Store,
  User,
  Wallet,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useHistoryOverlay } from '@/lib/hooks/use-history-overlay';
import { buildTelLink, buildWhatsAppLink, formatE164Display } from '@/lib/phone-utils';
import { PAYMENT_METHOD_LABELS } from '@/lib/payments/labels';
import type { PaymentStatus } from '@/lib/types/database';
import type { ServiceBooking, ServiceBookingStatus } from '@/lib/types/services';
import { updateServiceBookingStatus } from '@/lib/firebase/service-bookings';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

const BOOKING_STATUS: Record<ServiceBookingStatus, { label: string; className: string }> = {
  pending: { label: 'Awaiting confirmation', className: 'bg-amber-500/15 text-amber-800 ring-amber-500/25' },
  confirmed: { label: 'Confirmed', className: 'bg-sky-500/15 text-sky-800 ring-sky-500/25' },
  in_progress: { label: 'In session', className: 'bg-violet-500/15 text-violet-800 ring-violet-500/25' },
  completed: { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-500/15 text-rose-800 ring-rose-500/25' },
};

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  awaiting_payment: {
    label: 'Awaiting payment',
    className: 'bg-amber-500/15 text-amber-800 ring-amber-500/25',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/15 text-red-800 ring-red-500/25',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-500/15 text-slate-700 ring-slate-500/25',
  },
  cod_pending: {
    label: 'COD pending',
    className: 'bg-sky-500/15 text-sky-800 ring-sky-500/25',
  },
};

const JOURNEY: ServiceBookingStatus[] = ['pending', 'confirmed', 'in_progress', 'completed'];

function formatBookingRef(id: string): string {
  if (id.length <= 12) return id.toUpperCase();
  return `#${id.slice(-8).toUpperCase()}`;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatAppointmentDay(date: string): string {
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('en-UG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export function formatAppointmentTime(slot: string): string {
  const match = slot.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return slot;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' });
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        className
      )}
    >
      {children}
    </span>
  );
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error('Could not copy');
  }
}

function CopyChip({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={() => copyText(label, value)}
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      <Copy className="h-3 w-3" />
      Copy
    </button>
  );
}

type AdminBookingDialogProps = {
  booking: ServiceBooking | null;
  onClose: () => void;
};

export function AdminBookingDialog({ booking, onClose }: AdminBookingDialogProps) {
  useHistoryOverlay(Boolean(booking), onClose);

  useEffect(() => {
    if (!booking) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [booking]);

  const handleStatusUpdate = async (status: ServiceBookingStatus) => {
    if (!booking) return;
    try {
      await updateServiceBookingStatus(booking.id, status);
      toast.success(`Booking updated to ${BOOKING_STATUS[status].label.toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update booking');
    }
  };

  const phone = booking?.customerPhone?.trim() ?? '';
  const email = booking?.customerEmail?.trim() ?? '';
  const currentStep = booking ? JOURNEY.indexOf(booking.status) : -1;
  const paid = booking?.paymentStatus === 'paid';

  return (
    <AnimatePresence>
      {booking && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] touch-none bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-booking-dialog-title"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '40%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cn(
              'fixed z-[80] flex w-full flex-col overflow-hidden border border-border/80 bg-background shadow-2xl',
              'inset-0 h-[100dvh] max-h-[100dvh] rounded-none',
              'sm:inset-x-4 sm:top-[5%] sm:bottom-auto sm:mx-auto sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-2xl',
              'md:inset-x-6 md:top-[6%] md:max-w-3xl md:max-h-[88dvh]',
              'pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]'
            )}
          >
            <div className="relative shrink-0 overflow-hidden border-b border-border/70">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/18 via-primary/[0.06] to-accent/12" />
              <div className="relative px-3 py-2.5 sm:px-5 sm:py-3">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1 sm:gap-1.5">
                      <Badge className={BOOKING_STATUS[booking.status].className}>
                        {BOOKING_STATUS[booking.status].label}
                      </Badge>
                      <Badge className="bg-primary/10 text-primary ring-primary/20">Service</Badge>
                      {booking.paymentStatus ? (
                        <Badge className={PAYMENT_STATUS[booking.paymentStatus].className}>
                          {PAYMENT_STATUS[booking.paymentStatus].label}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <h2
                        id="admin-booking-dialog-title"
                        className="font-[family-name:var(--font-brand)] text-lg font-medium tracking-tight sm:text-xl"
                      >
                        {booking.serviceName || 'Service booking'}
                      </h2>
                      <p className="text-base font-bold tabular-nums text-primary sm:text-lg">
                        {formatUGX(booking.total || booking.amount)}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
                      <span className="font-medium text-foreground/80">{booking.customerName}</span>
                      <span className="mx-1 text-border">·</span>
                      <span className="whitespace-nowrap">{formatAppointmentDay(booking.date)}</span>
                      <span className="mx-1 text-border">·</span>
                      <span className="whitespace-nowrap">{formatAppointmentTime(booking.timeSlot)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition hover:text-foreground"
                    aria-label="Close booking"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
                {booking.status !== 'cancelled' ? (
                  <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Appointment journey
                    </p>
                    <ol className="grid grid-cols-4 gap-2">
                      {JOURNEY.map((step, index) => {
                        const reached = currentStep >= index;
                        const current = currentStep === index;
                        return (
                          <li key={step} className="min-w-0 text-center">
                            <div
                              className={cn(
                                'mx-auto mb-1.5 h-1.5 rounded-full',
                                reached ? 'bg-primary' : 'bg-muted'
                              )}
                            />
                            <p
                              className={cn(
                                'truncate text-[10px] font-semibold uppercase tracking-wide',
                                current ? 'text-primary' : reached ? 'text-foreground' : 'text-muted-foreground'
                              )}
                            >
                              {BOOKING_STATUS[step].label.replace('Awaiting confirmation', 'Pending')}
                            </p>
                          </li>
                        );
                      })}
                    </ol>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <label className="text-[11px] font-medium text-muted-foreground">Update status</label>
                      <select
                        value={booking.status}
                        onChange={(event) =>
                          void handleStatusUpdate(event.target.value as ServiceBookingStatus)
                        }
                        className="h-9 rounded-lg border border-border/80 bg-background px-2.5 text-sm capitalize shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {(Object.keys(BOOKING_STATUS) as ServiceBookingStatus[]).map((status) => (
                          <option key={status} value={status} disabled={status === 'cancelled' && paid}>
                            {BOOKING_STATUS[status].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>
                ) : (
                  <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                    <p className="text-sm text-muted-foreground">This appointment was cancelled.</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="text-[11px] font-medium text-muted-foreground">Update status</label>
                      <select
                        value={booking.status}
                        onChange={(event) =>
                          void handleStatusUpdate(event.target.value as ServiceBookingStatus)
                        }
                        className="h-9 rounded-lg border border-border/80 bg-background px-2.5 text-sm capitalize shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {(Object.keys(BOOKING_STATUS) as ServiceBookingStatus[]).map((status) => (
                          <option key={status} value={status} disabled={status === 'cancelled' && paid}>
                            {BOOKING_STATUS[status].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CalendarDays className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-semibold">When</h3>
                    </div>
                    <p className="text-base font-semibold tracking-tight">
                      {formatAppointmentDay(booking.date)}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatAppointmentTime(booking.timeSlot)}
                    </p>
                    <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                      {formatBookingRef(booking.id)}
                    </p>
                  </section>

                  <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {booking.locationType === 'mobile' ? (
                          <MapPin className="h-4 w-4" />
                        ) : (
                          <Store className="h-4 w-4" />
                        )}
                      </span>
                      <h3 className="text-sm font-semibold">Where</h3>
                    </div>
                    <p className="text-sm font-medium">
                      {booking.locationType === 'mobile' ? 'Mobile visit' : 'In studio'}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {booking.customerAddress ||
                        (booking.locationType === 'mobile'
                          ? 'Address not provided'
                          : 'Client comes to the provider’s studio')}
                    </p>
                  </section>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-semibold">Client</h3>
                    </div>
                    <p className="font-medium [overflow-wrap:anywhere]">{booking.customerName}</p>
                    <div className="mt-3 space-y-2">
                      {phone ? (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2">
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              <Phone className="h-3 w-3" /> Phone
                            </p>
                            <p className="truncate text-sm">{formatE164Display(phone)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <CopyChip label="Phone" value={phone} />
                            <a
                              href={buildTelLink(phone)}
                              className="text-[11px] font-semibold text-primary hover:underline"
                            >
                              Call
                            </a>
                            <a
                              href={buildWhatsAppLink(
                                phone,
                                `Hi ${booking.customerName}, this is ShiQueen about your ${booking.serviceName} booking.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 hover:underline"
                            >
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      ) : null}
                      {email ? (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2">
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              <Mail className="h-3 w-3" /> Email
                            </p>
                            <p className="truncate text-sm">{email}</p>
                          </div>
                          <CopyChip label="Email" value={email} />
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Scissors className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-semibold">Service</h3>
                    </div>
                    <p className="font-medium">{booking.serviceName || 'Service'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.providerName || 'Unassigned provider'}
                    </p>
                    {booking.notes ? (
                      <div className="mt-3 rounded-xl bg-muted/40 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Notes
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">{booking.notes}</p>
                      </div>
                    ) : null}
                  </section>
                </div>

                <section className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm sm:p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Wallet className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-semibold">Payment</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Service</span>
                      <span className="tabular-nums">{formatUGX(booking.amount)}</span>
                    </div>
                    {booking.travelFee > 0 ? (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Travel</span>
                        <span className="tabular-nums">{formatUGX(booking.travelFee)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-3 border-t border-border/60 pt-3 text-base font-semibold">
                      <span>Total</span>
                      <span className="tabular-nums text-primary">
                        {formatUGX(booking.total || booking.amount)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {booking.paymentMethod
                      ? PAYMENT_METHOD_LABELS[booking.paymentMethod]
                      : 'Payment method not recorded'}
                    {booking.paytotaReference ? ` · ${booking.paytotaReference}` : ''}
                  </p>
                </section>
              </div>
            </div>

            <div className="shrink-0 border-t border-border/70 bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-xs text-muted-foreground sm:text-left">
                  Booked {formatDateTime(booking.createdAt)}
                </p>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {phone ? (
                    <a
                      href={buildTelLink(phone)}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted sm:h-9 sm:w-auto"
                    >
                      Call client
                    </a>
                  ) : null}
                  <Button className="h-11 w-full sm:h-9 sm:w-auto" onClick={onClose}>
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
