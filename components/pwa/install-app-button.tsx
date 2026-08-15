'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  getInstallSurface,
  promptInstall,
  subscribeInstallAvailability,
} from '@/lib/pwa/install';
import {
  registerPartnerPushToken,
  requestPartnerNotificationPermission,
} from '@/lib/pwa/messaging';
import { unlockPartnerAudio } from '@/lib/pwa/sound';
import { cn } from '@/lib/utils';

async function prepareInstall(uid?: string | null) {
  unlockPartnerAudio();
  await requestPartnerNotificationPermission();
  if (uid) {
    await registerPartnerPushToken(uid);
  }
}

type InstallAppButtonProps = {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  label?: string;
  variant?: 'default' | 'sidebar' | 'drawer';
};

export function InstallAppButton({
  className,
  size = 'lg',
  label = 'Install App',
  variant = 'default',
}: InstallAppButtonProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => subscribeInstallAvailability(() => setTick((n) => n + 1)), []);
  useEffect(() => setReady(true), []);

  if (!ready) return null;

  const surface = getInstallSurface();
  if (surface === 'installed') return null;

  const handleClick = async () => {
    setBusy(true);
    try {
      await prepareInstall(user?.uid);
      await promptInstall();
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={busy}
        className={cn(
          'flex min-h-12 w-full items-center gap-3 rounded-lg px-4 py-3.5 text-left text-base font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60',
          className
        )}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
        ) : (
          <Download className="h-5 w-5 shrink-0" />
        )}
        {label}
      </button>
    );
  }

  if (variant === 'drawer') {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={busy}
        className={cn(
          'mb-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-60',
          className
        )}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {label}
      </button>
    );
  }

  return (
    <Button
      type="button"
      size={size}
      onClick={() => void handleClick()}
      disabled={busy}
      className={cn('h-12 gap-2 px-6 text-base font-semibold', className)}
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
      {label}
    </Button>
  );
}
