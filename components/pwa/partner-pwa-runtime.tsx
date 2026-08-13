'use client';

import { useEffect } from 'react';
import { PartnerAlerts } from '@/components/pwa/partner-alerts';
import { bindInstallPromptListener } from '@/lib/pwa/install';
import { registerPartnerServiceWorker } from '@/lib/pwa/register-sw';
import { registerPartnerPushToken } from '@/lib/pwa/messaging';
import { unlockPartnerAudio } from '@/lib/pwa/sound';
import { useAuth } from '@/lib/auth-context';

export function PartnerPwaRuntime() {
  const { user } = useAuth();

  useEffect(() => {
    bindInstallPromptListener();
    void registerPartnerServiceWorker();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    void registerPartnerPushToken(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    const unlock = () => unlockPartnerAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  return <PartnerAlerts />;
}
