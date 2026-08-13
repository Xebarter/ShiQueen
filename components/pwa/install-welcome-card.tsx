'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  canPromptInstall,
  dismissInstallCard,
  isIosSafari,
  isStandaloneDisplay,
  promptInstall,
  subscribeInstallAvailability,
  wasInstallDismissed,
} from '@/lib/pwa/install';
import {
  registerPartnerPushToken,
  requestPartnerNotificationPermission,
} from '@/lib/pwa/messaging';
import { unlockPartnerAudio } from '@/lib/pwa/sound';

type InstallWelcomeCardProps = {
  appName: string;
};

export function InstallWelcomeCard({ appName }: InstallWelcomeCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcome = searchParams.get('welcome') === '1';
  const [, setTick] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => subscribeInstallAvailability(() => setTick((n) => n + 1)), []);

  if (hidden || isStandaloneDisplay() || (!welcome && wasInstallDismissed())) {
    return null;
  }

  const nativePrompt = canPromptInstall();
  const ios = isIosSafari();

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

  const handleInstall = async () => {
    unlockPartnerAudio();
    await requestPartnerNotificationPermission();
    if (user?.uid) {
      await registerPartnerPushToken(user.uid);
    }
    if (nativePrompt) {
      await promptInstall();
    }
  };

  return (
    <div className="mb-5 overflow-hidden rounded-[1.4rem] border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-white to-[#F6EEDC]/70 p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Add {appName} to your home screen</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Install the app for faster access, plus sound and notification alerts when new work
            comes in.
          </p>
          {ios && !nativePrompt ? (
            <p className="mt-2 text-xs text-muted-foreground">
              iPhone: tap Share, then <strong>Add to Home Screen</strong>. Alerts work after the
              app is installed.
            </p>
          ) : (
            <Button className="mt-3 gap-2" onClick={() => void handleInstall()}>
              <Download className="h-4 w-4" />
              Install app
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-white"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
