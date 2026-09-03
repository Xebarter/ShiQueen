'use client';

import { addUserFcmToken } from '@/lib/firebase/users';
import { registerPartnerServiceWorker } from '@/lib/pwa/register-sw';
import type { IncomingPushPayload } from '@/lib/pwa/incoming';

export function getVapidKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() || '';
}

export async function requestPartnerNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export async function showPartnerNotification(
  title: string,
  options: NotificationOptions & {
    url?: string;
    renotify?: boolean;
    silent?: boolean;
    vibrate?: number[];
    requireInteraction?: boolean;
    actions?: Array<{ action: string; title: string; icon?: string }>;
  }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const { url, ...rest } = options;
  const registration = await registerPartnerServiceWorker();
  const payload: NotificationOptions & {
    actions?: Array<{ action: string; title: string; icon?: string }>;
  } = {
    silent: false,
    icon: '/web-app-manifest-192x192.png',
    badge: '/web-app-manifest-192x192.png',
    ...rest,
    data: { ...(typeof rest.data === 'object' && rest.data ? rest.data : {}), url },
  };

  if (registration?.showNotification) {
    await registration.showNotification(title, payload);
    return;
  }

  new Notification(title, payload);
}

export async function registerPartnerPushToken(uid: string): Promise<string | null> {
  const vapidKey = getVapidKey();
  if (!vapidKey || !uid || typeof window === 'undefined') return null;

  const permission = await requestPartnerNotificationPermission();
  if (permission !== 'granted') return null;

  const registration = await registerPartnerServiceWorker();
  if (!registration) return null;

  try {
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
    const { getFirebaseApp } = await import('@/lib/firebase/auth');
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;
    const app = getFirebaseApp();
    if (!app) return null;
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (token) {
      await addUserFcmToken(uid, token);
    }
    return token || null;
  } catch (error) {
    console.warn('[ShiQueen] FCM token registration failed:', error);
    return null;
  }
}

/** Fires while the PWA is open so incoming orders can ring even if the tab is focused. */
export function subscribeForegroundPush(
  onPayload: (payload: IncomingPushPayload) => void
): () => void {
  let unsubscribe: (() => void) | undefined;
  let cancelled = false;

  void (async () => {
    try {
      const { getMessaging, onMessage, isSupported } = await import('firebase/messaging');
      const { getFirebaseApp } = await import('@/lib/firebase/auth');
      const supported = await isSupported().catch(() => false);
      if (!supported || cancelled) return;
      const app = getFirebaseApp();
      if (!app) return;
      unsubscribe = onMessage(getMessaging(app), (message) => {
        const data = (message.data ?? {}) as IncomingPushPayload;
        onPayload({
          title: data.title || message.notification?.title,
          body: data.body || message.notification?.body,
          url: data.url,
          type: data.type,
          tag: data.tag,
        });
      });
    } catch (error) {
      console.warn('[ShiQueen] Foreground push listener failed:', error);
    }
  })();

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}
