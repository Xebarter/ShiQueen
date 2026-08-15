'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Smartphone, X } from 'lucide-react';
import { InstallAppButton } from '@/components/pwa/install-app-button';
import {
  dismissInstallCard,
  isStandaloneDisplay,
  subscribeInstallAvailability,
  wasInstallDismissed,
} from '@/lib/pwa/install';

type InstallWelcomeCardProps = {
  appName: string;
};

export function InstallWelcomeCard({ appName }: InstallWelcomeCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcome = searchParams.get('welcome') === '1';
  const [, setTick] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => subscribeInstallAvailability(() => setTick((n) => n + 1)), []);
  useEffect(() => setReady(true), []);

  if (!ready || hidden || isStandaloneDisplay() || (!welcome && wasInstallDismissed())) {
    return null;
  }

  const clearWelcome = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('welcome');
    const qs = params.toString();
    router.replace(qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  };

  const handleDismiss = () => {
    dismissInstallCard();
    setHidden(true);
    if (welcome) clearWelcome();
  };

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">Get {appName} on this device</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap below to add this dashboard as an app.
          </p>
          <InstallAppButton className="mt-4 w-full sm:w-auto" />
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
