'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ProviderShell } from '@/components/provider/provider-shell';
import { PartnerFormCard, PartnerPage, PartnerPageHeader } from '@/components/partner/partner-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';
import { upsertProviderAvailability } from '@/lib/firebase/provider-availability';
import { WEEKDAYS, weekdayLabel, getDefaultWeeklySlots } from '@/lib/services-utils';
import type { Weekday } from '@/lib/types/services';

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
        blackoutDates: patch.blackoutDates ?? avail?.blackoutDates ?? [],
        slotDurationMinutes: patch.slotDurationMinutes ?? avail?.slotDurationMinutes ?? 60,
      });
      toast.success('Availability saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const toggleDay = (day: Weekday) => {
    const current = slots[day] ?? [];
    const weeklySlots = {
      ...slots,
      [day]: current.length ? [] : [{ start: '09:00', end: '18:00' }],
    };
    void save({ weeklySlots });
  };

  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Studio"
          title="Availability"
          description="Set weekly hours and blackout dates for bookings."
        />
        <PartnerFormCard>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Slot duration</p>
              <p className="text-xs text-muted-foreground">Used when generating bookable times.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={15}
                step={15}
                defaultValue={avail?.slotDurationMinutes ?? 60}
                className="h-9 w-24"
                onBlur={(e) => {
                  const next = Number(e.target.value) || 60;
                  if (next !== (avail?.slotDurationMinutes ?? 60)) {
                    void save({ slotDurationMinutes: next });
                  }
                }}
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>

          <div className="space-y-2">
            {WEEKDAYS.map((day) => {
              const ranges = slots[day] ?? [];
              const open = ranges.length > 0;
              const range = ranges[0] ?? { start: '09:00', end: '18:00' };
              return (
                <div
                  key={day}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--partner-line)] bg-white/60 px-3.5 py-2.5"
                >
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleDay(day)}
                    className="w-24 text-left text-sm font-medium"
                  >
                    {weekdayLabel(day)}
                  </button>
                  {open ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        defaultValue={range.start}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                        onBlur={(e) =>
                          void save({
                            weeklySlots: { ...slots, [day]: [{ start: e.target.value, end: range.end }] },
                          })
                        }
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input
                        type="time"
                        defaultValue={range.end}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                        onBlur={(e) =>
                          void save({
                            weeklySlots: { ...slots, [day]: [{ start: range.start, end: e.target.value }] },
                          })
                        }
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Closed</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Blackout dates</p>
            <div className="flex flex-wrap gap-1.5">
              {(avail?.blackoutDates ?? []).map((date) => (
                <button
                  key={date}
                  type="button"
                  className="rounded-full border border-[var(--partner-line)] bg-[#F4EEEA] px-2.5 py-0.5 text-xs"
                  onClick={() =>
                    void save({
                      blackoutDates: (avail?.blackoutDates ?? []).filter((d) => d !== date),
                    })
                  }
                >
                  {date} ×
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={blackoutDraft}
                onChange={(e) => setBlackoutDraft(e.target.value)}
                className="h-9 max-w-[12rem]"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={busy || !blackoutDraft}
                onClick={() => {
                  void save({
                    blackoutDates: [...new Set([...(avail?.blackoutDates ?? []), blackoutDraft])],
                  });
                  setBlackoutDraft('');
                }}
              >
                Add date
              </Button>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => void save({ weeklySlots: getDefaultWeeklySlots() })}
          >
            Reset to default hours
          </Button>
        </PartnerFormCard>
      </PartnerPage>
    </ProviderShell>
  );
}
