'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  canPromptInstall,
  isIosSafari,
  isStandaloneDisplay,
  promptInstall,
  subscribeInstallAvailability,
} from '@/lib/pwa/install';
import {
  registerPartnerPushToken,
  requestPartnerNotificationPermission,
} from '@/lib/pwa/messaging';
import { unlockPartnerAudio } from '@/lib/pwa/sound';
import { cn } from '@/lib/utils';

type InstallAppButtonProps = {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  label?: string;
};

export function InstallAppButton({
  className,
  size = 'default',
  label = 'Install app',
}: InstallAppButtonProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => subscribeInstallAvailability(() => setTick((n) => n + 1)), []);

  if (isStandaloneDisplay()) return null;

  const nativePrompt = canPromptInstall();
  const ios = isIosSafari();

  const handleClick = async () => {
    unlockPartnerAudio();
    setBusy(true);
    try {
      await requestPartnerNotificationPermission();
      if (user?.uid) {
        await registerPartnerPushToken(user.uid);
      }
      if (nativePrompt) {
        await promptInstall();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!nativePrompt && !ios) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        On Android, open this page in Chrome to install. On iPhone, tap Share, then Add to Home
        Screen.
      </p>
    );
  }

  if (ios && !nativePrompt) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        On iPhone, tap <strong>Share</strong> then <strong>Add to Home Screen</strong>.
      </p>
    );
  }

  return (
    <Button
      type="button"
      size={size}
      onClick={() => void handleClick()}
      disabled={busy}
      className={cn('gap-2', className)}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {label}
      <Smartphone className="h-3.5 w-3.5 opacity-70" />
    </Button>
  );
}
