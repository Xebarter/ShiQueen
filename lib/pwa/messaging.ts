'use client';

import { addUserFcmToken } from '@/lib/firebase/users';
import { registerPartnerServiceWorker } from '@/lib/pwa/register-sw';

export function getVapidKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() || '';
}

export async function requestPartnerNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export async function showPartnerNotification(title: string, options: NotificationOptions & { url?: string }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const { url, ...rest } = options;
  const registration = await registerPartnerServiceWorker();
  const payload: NotificationOptions = {
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
