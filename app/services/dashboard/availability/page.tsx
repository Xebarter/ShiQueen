'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarOff,
  CalendarClock,
  Clock3,
  Loader2,
  RotateCcw,
  Plus,
  X,
} from 'lucide-react';
import { ProviderShell } from '@/components/provider/provider-shell';
import {
  PartnerCard,
  PartnerPage,
  PartnerPageHeader,
} from '@/components/partner/partner-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';
import { upsertProviderAvailability } from '@/lib/firebase/provider-availability';
import { WEEKDAYS, weekdayLabel, getDefaultWeeklySlots } from '@/lib/services-utils';
import type { Weekday } from '@/lib/types/services';
import { cn } from '@/lib/utils';

const SLOT_OPTIONS = [15, 30, 45, 60, 90] as const;

function weekdayShort(day: Weekday): string {
  return weekdayLabel(day).slice(0, 3);
}

function formatBlackout(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-UG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatClock(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString('en-UG', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ProviderAvailabilityPage() {
  const { providerId } = useAuth();
  const { availability } = useServices();
  const avail = availability.find((a) => a.providerId === providerId || a.id === providerId);
  const [blackoutDraft, setBlackoutDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const slots = useMemo(
    () => avail?.weeklySlots ?? getDefaultWeeklySlots(),
    [avail]
  );

  const openDays = useMemo(
    () => WEEKDAYS.filter((day) => (slots[day] ?? []).length > 0).length,
    [slots]
  );

  const blackouts = avail?.blackoutDates ?? [];
  const slotDuration = avail?.slotDurationMinutes ?? 60;

  if (!providerId) return null;

  const save = async (patch: {
    weeklySlots?: typeof slots;
    blackoutDates?: string[];
    slotDurationMinutes?: number;
  }) => {
    setBusy(true);
    try {
      await upsertProviderAvailability({
        id: providerId,
        providerId,
        weeklySlots: patch.weeklySlots ?? slots,
        blackoutDates: patch.blackoutDates ?? blackouts,
        slotDurationMinutes: patch.slotDurationMinutes ?? slotDuration,
      });
      toast.success('Hours updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const toggleDay = (day: Weekday, open: boolean) => {
    const weeklySlots = {
      ...slots,
      [day]: open ? [{ start: '09:00', end: '18:00' }] : [],
    };
    void save({ weeklySlots });
  };

  const updateDayHours = (day: Weekday, start: string, end: string) => {
    if (!start || !end) return;
    if (start >= end) {
      toast.error('End time must be after start time');
      return;
    }
    void save({
      weeklySlots: { ...slots, [day]: [{ start, end }] },
    });
  };

  const addBlackout = () => {
    if (!blackoutDraft) return;
    void save({
      blackoutDates: [...new Set([...blackouts, blackoutDraft])].sort(),
    });
    setBlackoutDraft('');
  };

  return (
    <ProviderShell>
      <PartnerPage className="max-w-5xl">
        <PartnerPageHeader
          eyebrow="Studio"
          title="Hours"
          description="Set when customers can book you, how long each slot lasts, and which dates are closed."
          action={
            busy ? (
              <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </span>
            ) : null
          }
        />

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Open days
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                  {openDays}
                  <span className="text-base font-medium text-muted-foreground"> / 7</span>
                </p>
              </div>
              <span className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/10">
                <CalendarClock className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Slot length
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                  {slotDuration}
                  <span className="text-base font-medium text-muted-foreground"> min</span>
                </p>
              </div>
              <span className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/10">
                <Clock3 className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Blackouts
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                  {blackouts.length}
                </p>
              </div>
              <span className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/10">
                <CalendarOff className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          <PartnerCard className="overflow-visible">
            <div className="border-b border-border/60 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-tight">Weekly schedule</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Toggle a day open, then set the window customers can book.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  className="shrink-0 self-start rounded-full"
                  onClick={() => void save({ weeklySlots: getDefaultWeeklySlots() })}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset defaults
                </Button>
              </div>
            </div>

            <div className="divide-y divide-border/50">
              {WEEKDAYS.map((day) => {
                const ranges = slots[day] ?? [];
                const open = ranges.length > 0;
                const range = ranges[0] ?? { start: '09:00', end: '18:00' };

                return (
                  <div
                    key={day}
                    className={cn(
                      'px-4 py-3.5 transition-colors sm:px-5',
                      open ? 'bg-card' : 'bg-muted/20'
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold tracking-tight">
                            <span className="sm:hidden">{weekdayShort(day)}</span>
                            <span className="hidden sm:inline">{weekdayLabel(day)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {open
                              ? `${formatClock(range.start)} – ${formatClock(range.end)}`
                              : 'Closed for bookings'}
                          </p>
                        </div>

                        <div
                          className="inline-flex shrink-0 rounded-full border border-border/70 bg-background p-0.5 shadow-sm"
                          role="group"
                          aria-label={`${weekdayLabel(day)} availability`}
                        >
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleDay(day, true)}
                            className={cn(
                              'rounded-full px-3 py-1 text-xs font-semibold transition',
                              open
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleDay(day, false)}
                            className={cn(
                              'rounded-full px-3 py-1 text-xs font-semibold transition',
                              !open
                                ? 'bg-foreground/90 text-background shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            Closed
                          </button>
                        </div>
                      </div>

                      {open ? (
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:w-auto sm:max-w-none sm:grid-cols-none sm:flex">
                          <label className="sr-only" htmlFor={`${day}-start`}>
                            {weekdayLabel(day)} start
                          </label>
                          <input
                            id={`${day}-start`}
                            key={`${day}-start-${range.start}`}
                            type="time"
                            defaultValue={range.start}
                            disabled={busy}
                            className={cn(
                              'h-11 w-full rounded-xl border border-border/70 bg-background px-3 text-sm font-medium tabular-nums shadow-sm',
                              'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                              'disabled:opacity-60 sm:h-10 sm:w-[8.25rem]'
                            )}
                            onBlur={(e) => updateDayHours(day, e.target.value, range.end)}
                          />
                          <span className="text-center text-xs font-medium text-muted-foreground">
                            to
                          </span>
                          <label className="sr-only" htmlFor={`${day}-end`}>
                            {weekdayLabel(day)} end
                          </label>
                          <input
                            id={`${day}-end`}
                            key={`${day}-end-${range.end}`}
                            type="time"
                            defaultValue={range.end}
                            disabled={busy}
                            className={cn(
                              'h-11 w-full rounded-xl border border-border/70 bg-background px-3 text-sm font-medium tabular-nums shadow-sm',
                              'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                              'disabled:opacity-60 sm:h-10 sm:w-[8.25rem]'
                            )}
                            onBlur={(e) => updateDayHours(day, range.start, e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="hidden rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground sm:block">
                          Not bookable
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </PartnerCard>

          <div className="space-y-5">
            <PartnerCard className="overflow-visible">
              <div className="border-b border-border/60 px-4 py-4 sm:px-5">
                <h2 className="text-base font-semibold tracking-tight">Booking slots</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  How long each bookable time block lasts.
                </p>
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-wrap gap-2">
                  {SLOT_OPTIONS.map((minutes) => {
                    const active = slotDuration === minutes;
                    return (
                      <button
                        key={minutes}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (minutes !== slotDuration) {
                            void save({ slotDurationMinutes: minutes });
                          }
                        }}
                        className={cn(
                          'min-w-[4.25rem] rounded-full px-3.5 py-2 text-sm font-semibold tabular-nums transition',
                          'ring-1 ring-inset disabled:opacity-60',
                          active
                            ? 'bg-primary text-primary-foreground ring-primary shadow-sm'
                            : 'bg-background text-foreground ring-border/80 hover:bg-muted/60'
                        )}
                      >
                        {minutes}m
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Shorter slots give customers more choices. Match this to how long your typical
                  service runs.
                </p>
              </div>
            </PartnerCard>

            <PartnerCard className="overflow-visible">
              <div className="border-b border-border/60 px-4 py-4 sm:px-5">
                <h2 className="text-base font-semibold tracking-tight">Blackout dates</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Block holidays, travel days, or private appointments.
                </p>
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                {blackouts.length > 0 ? (
                  <ul className="space-y-2">
                    {blackouts.map((date) => (
                      <li
                        key={date}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{formatBlackout(date)}</p>
                          <p className="text-[11px] tabular-nums text-muted-foreground">{date}</p>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={`Remove ${date}`}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-700 disabled:opacity-60"
                          onClick={() =>
                            void save({
                              blackoutDates: blackouts.filter((d) => d !== date),
                            })
                          }
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-6 text-center">
                    <CalendarOff className="mx-auto h-5 w-5 text-muted-foreground/70" />
                    <p className="mt-2 text-sm font-medium">No blackout dates</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your weekly hours apply every matching weekday.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="date"
                    value={blackoutDraft}
                    onChange={(e) => setBlackoutDraft(e.target.value)}
                    className="h-11 flex-1 rounded-xl sm:h-10"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || !blackoutDraft}
                    className="h-11 shrink-0 rounded-full sm:h-10"
                    onClick={addBlackout}
                  >
                    <Plus className="h-4 w-4" />
                    Add date
                  </Button>
                </div>
              </div>
            </PartnerCard>
          </div>
        </div>
      </PartnerPage>
    </ProviderShell>
  );
}
