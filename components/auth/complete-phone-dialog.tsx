'use client';

import { useEffect, useId, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { shouldPromptForPhone } from '@/lib/auth-phone';
import { updateUserProfile } from '@/lib/firebase/users';
import {
  formatNationalMobileInput,
  toE164UgandaPhone,
} from '@/lib/phone-utils';

function initialNationalNumber(phone?: string): string {
  if (!phone) return '';
  return formatNationalMobileInput(phone);
}

export function CompletePhoneDialog() {
  const titleId = useId();
  const descriptionId = useId();
  const pathname = usePathname();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [nationalNumber, setNationalNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const open =
    !completed &&
    shouldPromptForPhone({ user, profile, loading, pathname });

  useEffect(() => {
    setCompleted(false);
  }, [user?.uid]);

  useEffect(() => {
    if (!open) return;
    setNationalNumber(
      initialNationalNumber(profile?.phone ?? user?.phoneNumber ?? profile?.defaultAddress?.phone ?? '')
    );
  }, [open, profile?.phone, profile?.defaultAddress?.phone, user?.phoneNumber]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !user) return null;

  const phoneIsValid = Boolean(toE164UgandaPhone(nationalNumber));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const phoneE164 = toE164UgandaPhone(nationalNumber);
    if (!phoneE164) {
      toast.error('Enter a valid Uganda mobile number, like 07XX XXX XXX.');
      return;
    }

    setSaving(true);
    try {
      const address = profile?.defaultAddress;
      await updateUserProfile(user.uid, {
        phone: phoneE164,
        ...(address && !toE164UgandaPhone(address.phone)
          ? { defaultAddress: { ...address, phone: phoneE164 } }
          : {}),
      });
      await refreshProfile();
      setCompleted(true);
      toast.success('Phone number saved');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Could not save your number');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-[oklch(0.22_0.04_340_/_0.55)] backdrop-blur-md"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-[26.5rem] overflow-hidden rounded-2xl border border-white/70 bg-card/95 shadow-[0_28px_80px_-28px_oklch(0.28_0.08_340_/_0.55)] ring-1 ring-black/[0.04] backdrop-blur-xl"
      >
        <div
          aria-hidden
          className="h-1 w-full bg-gradient-to-r from-primary via-primary to-accent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,oklch(0.74_0.12_62_/_0.18),transparent_70%)]"
        />

        <form onSubmit={handleSubmit} className="relative px-5 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_28px_-12px_oklch(0.40_0.13_340_/_0.7)]">
              <Smartphone className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-brand)] text-[1.7rem] font-medium leading-tight tracking-tight text-foreground sm:text-[1.9rem]"
            >
              Add your number
            </h2>
            <p
              id={descriptionId}
              className="mt-2 text-sm text-muted-foreground sm:text-[15px]"
            >
              For deliveries and bookings.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="complete-phone" className="text-sm font-medium text-foreground">
              Mobile number
            </Label>
            <div className="flex h-12 overflow-hidden rounded-xl border border-input bg-background shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="flex shrink-0 items-center border-r border-input bg-muted/40 px-3.5 text-sm font-semibold text-foreground">
                +256
              </span>
              <Input
                id="complete-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="7XX XXX XXX"
                value={nationalNumber}
                onChange={(event) =>
                  setNationalNumber(formatNationalMobileInput(event.target.value))
                }
                className="h-12 rounded-none border-0 text-base shadow-none focus-visible:ring-0 md:text-sm"
                required
                disabled={saving}
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            className="mt-6 h-12 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/20"
            disabled={saving || !phoneIsValid}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
