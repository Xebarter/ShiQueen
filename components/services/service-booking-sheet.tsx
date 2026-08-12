'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Loader2,
  MapPin,
  Smartphone,
  User,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GiftPayChoice, type GiftPayMode } from '@/components/payments/gift-pay-choice';
import { GiftPayLinkPanel } from '@/components/payments/gift-pay-link-panel';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';
import {
  createServiceBooking,
  getBookedTimeSlotsForProviderDate,
} from '@/lib/firebase/service-bookings';
import { createSharedBooking } from '@/lib/firebase/shared-bookings';
import { incrementServiceBookingCount } from '@/lib/firebase/service-listings';
import { getAvailableTimeSlots, resolveListingImage } from '@/lib/services-utils';
import { generateBookingId } from '@/lib/shared-booking-utils';
import { shareOrCopy } from '@/lib/share';
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

type Step = 'summary' | 'schedule' | 'details' | 'pay';

const STEPS: { id: Step; label: string }[] = [
  { id: 'summary', label: 'Service' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'details', label: 'Details' },
  { id: 'pay', label: 'Pay' },
];

export function ServiceBookingSheet({
  open,
  onClose,
  listing,
  provider,
}: ServiceBookingSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { availability } = useServices();

  useHistoryOverlay(open, onClose);

  const [step, setStep] = useState<Step>('summary');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
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
  const [payMode, setPayMode] = useState<GiftPayMode>('self');
  const [giftMessage, setGiftMessage] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      setForm((f) => ({ ...f, email: user.email ?? f.email }));
    }
  }, [user?.email]);

  useEffect(() => {
    if (!open) {
      setStep('summary');
      setShareUrl(null);
      setExpiresAt(null);
      setPayMode('self');
      setLoading(false);
    }
  }, [open]);

  const providerAvailability = useMemo(
    () => availability.find((a) => a.providerId === provider.id) ?? null,
    [availability, provider.id]
  );

  useEffect(() => {
    if (!date || !open) {
      setBookedSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    fetch(
      `/api/services/availability?providerId=${encodeURIComponent(provider.id)}&date=${encodeURIComponent(date)}`
    )
      .then(async (res) => {
        const data = await res.json();
        if (data.requiresClientRead) {
          return getBookedTimeSlotsForProviderDate(provider.id, date);
        }
        return Array.isArray(data.slots) ? (data.slots as string[]) : [];
      })
      .then((slots) => {
        if (!cancelled) setBookedSlots(slots);
      })
      .catch(() => {
        if (!cancelled) setBookedSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, open, provider.id]);

  const slots = useMemo(() => {
    if (!date) return [];
    return getAvailableTimeSlots(providerAvailability, bookedSlots, date);
  }, [providerAvailability, bookedSlots, date]);

  const travelFee =
    locationType === 'mobile' && provider.travelFee > 0 ? provider.travelFee : 0;
  const amount = listing.basePrice;
  const total = amount + travelFee;
  const minDate = new Date().toISOString().split('T')[0];
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  if (!open) return null;

  const validateSchedule = () => {
    if (!date || !timeSlot) {
      toast.error('Please choose a date and time.');
      return false;
    }
    if (locationType === 'mobile' && !customerAddress.trim()) {
      toast.error('Please enter your address for home service.');
      return false;
    }
    return true;
  };

  const validateDetails = () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim()) {
      toast.error('Please enter your name, phone, and email.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (step === 'summary') setStep('schedule');
    else if (step === 'schedule') {
      if (!validateSchedule()) return;
      setStep('details');
    } else if (step === 'details') {
      if (!validateDetails()) return;
      setStep('pay');
    }
  };

  const goBack = () => {
    if (step === 'schedule') setStep('summary');
    else if (step === 'details') setStep('schedule');
    else if (step === 'pay') setStep('details');
  };

  const handleSelfPay = async () => {
    if (!validateSchedule() || !validateDetails()) return;

    setLoading(true);
    try {
      const bookingId = generateBookingId();
      const response = await fetch('/api/payments/paytota/initiate-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          userId: user?.uid ?? null,
          serviceId: listing.id,
          providerId: provider.id,
          serviceName: listing.name,
          providerName: provider.businessName || provider.name,
          customerName: form.fullName.trim(),
          customerPhone: form.phone.trim(),
          customerEmail: form.email.trim(),
          date,
          timeSlot,
          locationType,
          customerAddress: locationType === 'mobile' ? customerAddress.trim() : undefined,
          notes: notes.trim() || undefined,
          amount,
          travelFee,
          total,
          useStkPush: true,
          allowOfflineFallback: true,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        bookingId?: string;
        checkoutUrl?: string;
        returnUrl?: string;
        offlineFallback?: boolean;
        requiresClientBooking?: boolean;
        booking?: Parameters<typeof createServiceBooking>[0];
        stk?: { status?: string; details?: { message?: string } };
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to start payment.');
      }

      if (data.requiresClientBooking && data.booking) {
        await createServiceBooking(data.booking);
      }

      await incrementServiceBookingCount(listing.id);

      if (data.offlineFallback && data.bookingId) {
        toast.success(data.message ?? 'Booking saved. We will contact you for payment.');
        onClose();
        router.push(
          `/services/booking-confirmation?bookingId=${encodeURIComponent(data.bookingId)}&payment=offline`
        );
        return;
      }

      if (data.stk?.status === 'pending' && data.bookingId) {
        toast.success(data.stk.details?.message ?? 'Check your phone to approve the payment.');
        onClose();
        router.push(
          `/services/booking-confirmation?bookingId=${encodeURIComponent(data.bookingId)}&payment=pending`
        );
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.returnUrl) {
        onClose();
        router.push(data.returnUrl);
        return;
      }

      throw new Error('No payment method available. Please try again.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGiftLink = async () => {
    if (!validateSchedule() || !validateDetails()) return;

    setLoading(true);
    try {
      const bookingId = generateBookingId();
      const response = await fetch('/api/services/book/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          serviceId: listing.id,
          providerId: provider.id,
          serviceName: listing.name,
          providerName: provider.businessName || provider.name,
          customerName: form.fullName.trim(),
          customerPhone: form.phone.trim(),
          customerEmail: form.email.trim(),
          date,
          timeSlot,
          locationType,
          customerAddress: locationType === 'mobile' ? customerAddress.trim() : undefined,
          notes: notes.trim() || undefined,
          amount,
          travelFee,
          total,
          durationMinutes: listing.durationMinutes,
          galleryImage: resolveListingImage(listing) ?? undefined,
          senderUserId: user?.uid ?? null,
          senderMessage: giftMessage.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create payment link.');
      }

      if (data.requiresClientStorage) {
        await createServiceBooking(data.booking);
        await createSharedBooking({
          id: data.token as string,
          bookingId: data.bookingId as string,
          snapshot: data.sharedBooking.snapshot,
          senderUserId: data.sharedBooking.senderUserId ?? null,
          senderMessage: data.sharedBooking.senderMessage,
          expiresAt: new Date(data.sharedBooking.expiresAt as string),
        });
      }

      await incrementServiceBookingCount(listing.id);
      setShareUrl(data.shareUrl as string);
      setExpiresAt(data.expiresAt as string);
      toast.success('Payment link created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create payment link.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareGiftLink = async () => {
    if (!shareUrl) return;
    const result = await shareOrCopy({
      title: `Pay for my SheQueen booking (${formatUGX(total)})`,
      text:
        giftMessage.trim() ||
        `Could you pay for my ${listing.name} booking on SheQueen?`,
      url: shareUrl,
    });
    if (result === 'copied') toast.success('Payment link copied to clipboard');
  };

  const handleCopyGiftLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Payment link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close booking"
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Book &amp; pay
              </p>
              <h2 className="mt-0.5 text-lg font-semibold tracking-tight">{listing.name}</h2>
              <p className="text-sm text-muted-foreground">
                {provider.businessName || provider.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-1 items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                    i < stepIndex
                      ? 'bg-primary text-primary-foreground'
                      : i === stepIndex
                        ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 rounded-full',
                      i < stepIndex ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {step === 'summary' && (
                <>
                  <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-card p-5">
                    <p className="text-2xl font-semibold tracking-tight text-primary">
                      {formatUGX(listing.basePrice)}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {listing.durationMinutes} minutes
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground line-clamp-4">
                      {listing.description ||
                        'Reserve this service with full payment upfront. Your slot is confirmed once payment succeeds.'}
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Pay securely with mobile money
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Or send a link for someone else to pay
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Instant confirmation after payment
                    </li>
                  </ul>
                </>
              )}

              {step === 'schedule' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="book-date" className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Date
                      </Label>
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
                      <Label htmlFor="book-time" className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Time
                      </Label>
                      <select
                        id="book-time"
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        required
                        disabled={!date || slotsLoading || slots.length === 0}
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      >
                        <option value="">
                          {!date
                            ? 'Pick a date first'
                            : slotsLoading
                              ? 'Loading…'
                              : slots.length === 0
                                ? 'No slots'
                                : 'Select time'}
                        </option>
                        {slots.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(listing.supportsMobile || listing.supportsInStudio) && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Location
                      </Label>
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
                      {provider.travelFee > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Travel fee: {formatUGX(provider.travelFee)}
                        </p>
                      )}
                      {provider.serviceAreas.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Serves: {provider.serviceAreas.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {step === 'details' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="book-name" className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Your name
                    </Label>
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
                      <Label htmlFor="book-email">Email</Label>
                      <Input
                        id="book-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        required
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
                </>
              )}

              {step === 'pay' && (
                <>
                  <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-medium">{formatUGX(amount)}</span>
                    </div>
                    {travelFee > 0 && (
                      <div className="mt-1 flex justify-between gap-3">
                        <span className="text-muted-foreground">Travel fee</span>
                        <span className="font-medium">{formatUGX(travelFee)}</span>
                      </div>
                    )}
                    <div className="mt-2 flex justify-between gap-3 border-t border-border/60 pt-2">
                      <span className="font-semibold">Total due now</span>
                      <span className="font-semibold text-primary">{formatUGX(total)}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {date} · {timeSlot} ·{' '}
                      {locationType === 'mobile' ? 'Home visit' : 'In studio'}
                    </p>
                  </div>

                  <GiftPayChoice mode={payMode} onChange={setPayMode} />

                  {payMode === 'self' ? (
                    <Button
                      type="button"
                      className="h-12 w-full gap-2 rounded-xl text-base font-semibold"
                      disabled={loading}
                      onClick={handleSelfPay}
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Smartphone className="h-5 w-5" />
                      )}
                      Pay {formatUGX(total)} with mobile money
                    </Button>
                  ) : (
                    <GiftPayLinkPanel
                      amountLabel={listing.name}
                      total={total}
                      recipientName={form.fullName.trim() || 'you'}
                      message={giftMessage}
                      onMessageChange={setGiftMessage}
                      shareUrl={shareUrl}
                      expiresAt={expiresAt}
                      loading={loading}
                      canCreate={!shareUrl}
                      onCreateLink={handleCreateGiftLink}
                      onShareLink={handleShareGiftLink}
                      onCopyLink={handleCopyGiftLink}
                      createLabel="Create booking payment link"
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step !== 'pay' && (
          <div className="sticky bottom-0 flex gap-2 border-t border-border/60 bg-background/95 p-4 backdrop-blur">
            {step !== 'summary' && (
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 gap-2 rounded-xl"
                onClick={goBack}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <Button
              type="button"
              className="h-11 flex-1 gap-2 rounded-xl font-semibold"
              onClick={goNext}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'pay' && !shareUrl && (
          <div className="sticky bottom-0 border-t border-border/60 bg-background/95 p-4 backdrop-blur">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 rounded-xl"
              onClick={goBack}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to details
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
