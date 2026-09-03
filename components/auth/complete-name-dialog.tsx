'use client';

import { useEffect, useId, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { shouldPromptForName } from '@/lib/auth-phone';
import { updateAuthDisplayName } from '@/lib/firebase/auth-account';
import { updateUserProfile } from '@/lib/firebase/users';
import { normalizePersonName } from '@/lib/user-display';

export function CompleteNameDialog() {
  const titleId = useId();
  const descriptionId = useId();
  const pathname = usePathname();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const open =
    !completed &&
    shouldPromptForName({ user, profile, loading, pathname });

  useEffect(() => {
    setCompleted(false);
  }, [user?.uid]);

  useEffect(() => {
    if (!open) return;
    setName(
      normalizePersonName(profile?.displayName ?? user?.displayName ?? profile?.defaultAddress?.fullName ?? '')
    );
  }, [open, profile?.displayName, profile?.defaultAddress?.fullName, user?.displayName]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !user) return null;

  const nextName = normalizePersonName(name);
  const nameIsValid = nextName.length >= 2;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nameIsValid) {
      toast.error('Enter your name.');
      return;
    }

    setSaving(true);
    try {
      await updateAuthDisplayName(user, nextName);
      const address = profile?.defaultAddress;
      await updateUserProfile(user.uid, {
        displayName: nextName,
        ...(address && !address.fullName.trim()
          ? { defaultAddress: { ...address, fullName: nextName } }
          : {}),
      });
      await refreshProfile();
      setCompleted(true);
      toast.success('Name saved');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Could not save your name');
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
              <User className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-brand)] text-[1.7rem] font-medium leading-tight tracking-tight text-foreground sm:text-[1.9rem]"
            >
              Add your name
            </h2>
            <p
              id={descriptionId}
              className="mt-2 text-sm text-muted-foreground sm:text-[15px]"
            >
              For orders and bookings.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="complete-name" className="text-sm font-medium text-foreground">
              Name
            </Label>
            <Input
              id="complete-name"
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              placeholder="Jane Nakato"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 rounded-xl text-base shadow-sm md:text-sm"
              required
              disabled={saving}
              autoFocus
              maxLength={80}
            />
          </div>

          <Button
            type="submit"
            className="mt-6 h-12 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/20"
            disabled={saving || !nameIsValid}
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
