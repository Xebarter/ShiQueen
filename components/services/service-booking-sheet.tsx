'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';
import { createServiceBooking } from '@/lib/firebase/service-bookings';
import { incrementServiceBookingCount } from '@/lib/firebase/service-listings';
import { getAvailableTimeSlots } from '@/lib/services-utils';
import type { ServiceListing, ServiceProvider } from '@/lib/types/services';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';
import { useHistoryOverlay } from '@/lib/hooks/use-history-overlay';

interface ServiceBookingSheetProps {
  open: boolean;
  onClose: () => void;
  listing: ServiceListing;
  provider: ServiceProvider;
}

function generateBookingId(): string {
  return `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ServiceBookingSheet({
  open,
  onClose,
  listing,
  provider,
}: ServiceBookingSheetProps) {
  const { user } = useAuth();
  const { bookings, availability } = useServices();

  useHistoryOverlay(open, onClose);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [locationType, setLocationType] = useState<'studio' | 'mobile'>(
    listing.supportsInStudio ? 'studio' : 'mobile'
  );
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: user?.email ?? '',
  });

  useEffect(() => {
    if (user?.email) {
      setForm((f) => ({ ...f, email: user.email ?? f.email }));
    }
  }, [user?.email]);

  const providerAvailability = useMemo(
    () => availability.find((a) => a.providerId === provider.id) ?? null,
    [availability, provider.id]
  );

  const slots = useMemo(() => {
    if (!date) return [];
    return getAvailableTimeSlots(providerAvailability, bookings, date);
  }, [providerAvailability, bookings, date]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !timeSlot || !form.fullName.trim() || !form.phone.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (locationType === 'mobile' && !customerAddress.trim()) {
      toast.error('Please enter your address for home service.');
      return;
    }

    setLoading(true);
    try {
      const id = generateBookingId();
      await createServiceBooking({
        id,
        serviceId: listing.id,
        providerId: provider.id,
        userId: user?.uid ?? null,
        customerName: form.fullName.trim(),
        customerPhone: form.phone.trim(),
        customerEmail: form.email.trim() || undefined,
        date,
        timeSlot,
        locationType,
        customerAddress: locationType === 'mobile' ? customerAddress.trim() : undefined,
        notes: notes.trim() || undefined,
        status: 'pending',
      });
      await incrementServiceBookingCount(listing.id);
      toast.success('Booking request sent! The provider will confirm shortly.');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit booking.');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close booking"
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-background px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Book service</h2>
            <p className="text-sm text-muted-foreground">{listing.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="rounded-xl bg-primary/5 px-4 py-3 text-sm">
            <span className="font-medium">{formatUGX(listing.basePrice)}</span>
            <span className="text-muted-foreground"> · {listing.durationMinutes} min</span>
            {locationType === 'mobile' && provider.travelFee > 0 && (
              <span className="text-muted-foreground"> · +{formatUGX(provider.travelFee)} travel</span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="book-date">Date</Label>
              <Input
                id="book-date"
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTimeSlot('');
                }}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-time">Time</Label>
              <select
                id="book-time"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                required
                disabled={!date || slots.length === 0}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">{slots.length === 0 ? 'No slots' : 'Select time'}</option>
                {slots.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {(listing.supportsMobile || listing.supportsInStudio) && (
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="grid grid-cols-2 gap-2">
                {listing.supportsInStudio && (
                  <button
                    type="button"
                    onClick={() => setLocationType('studio')}
                    className={cn(
                      'rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition',
                      locationType === 'studio'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    In studio
                  </button>
                )}
                {listing.supportsMobile && (
                  <button
                    type="button"
                    onClick={() => setLocationType('mobile')}
                    className={cn(
                      'rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition',
                      locationType === 'mobile'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    Home visit
                  </button>
                )}
              </div>
            </div>
          )}

          {locationType === 'mobile' && (
            <div className="space-y-2">
              <Label htmlFor="book-address">Your address</Label>
              <Input
                id="book-address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Street, area, landmark"
                required
                className="h-11 rounded-xl"
              />
              {provider.serviceAreas.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Serves: {provider.serviceAreas.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="book-name">Your name</Label>
            <Input
              id="book-name"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="book-phone">Phone</Label>
              <Input
                id="book-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
                placeholder="07XX XXX XXX"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-email">Email (optional)</Label>
              <Input
                id="book-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="book-notes">Notes (optional)</Label>
            <Input
              id="book-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests?"
              className="h-11 rounded-xl"
            />
          </div>

          <Button type="submit" className="h-12 w-full rounded-xl text-base font-semibold" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Request booking
          </Button>
        </form>
      </div>
    </div>
  );
}
