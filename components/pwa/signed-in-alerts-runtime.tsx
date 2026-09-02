'use client';

import { useEffect } from 'react';
import { AdminAlerts } from '@/components/pwa/admin-alerts';
import { PartnerAlerts } from '@/components/pwa/partner-alerts';
import { bindInstallPromptListener } from '@/lib/pwa/install';
import { registerPartnerServiceWorker } from '@/lib/pwa/register-sw';
import { registerPartnerPushToken } from '@/lib/pwa/messaging';
import { unlockPartnerAudio } from '@/lib/pwa/sound';
import { useAuth } from '@/lib/auth-context';

/** Registers push + in-app alerts on every page where an admin or partner is signed in. */
export function SignedInAlertsRuntime() {
  const { user, isAdmin, supplierId, providerId } = useAuth();
  const wantsPush = Boolean(user?.uid && (isAdmin || supplierId || providerId));

  useEffect(() => {
    if (!wantsPush) return;
    bindInstallPromptListener();
    void registerPartnerServiceWorker();
  }, [wantsPush]);

  useEffect(() => {
    if (!wantsPush || !user?.uid) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    void registerPartnerPushToken(user.uid);
  }, [wantsPush, user?.uid]);

  useEffect(() => {
    if (!wantsPush) return;
    const unlock = () => unlockPartnerAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [wantsPush]);

  if (!wantsPush) return null;

  return (
    <>
      {isAdmin ? <AdminAlerts /> : null}
      {supplierId || providerId ? <PartnerAlerts /> : null}
    </>
  );
}
