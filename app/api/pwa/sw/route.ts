import { NextResponse } from 'next/server';

export function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  };

  const body = `/* SheQueen partner PWA service worker */
const FIREBASE_CONFIG = ${JSON.stringify(config)};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(openOrFocus(targetUrl));
});

async function openOrFocus(url) {
  const absolute = new URL(url, self.location.origin).href;
  const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windowClients) {
    if ('focus' in client) {
      await client.focus();
      if ('navigate' in client && client.url !== absolute) {
        try { await client.navigate(absolute); } catch (_) { /* ignore */ }
      }
      return;
    }
  }
  if (self.clients.openWindow) {
    await self.clients.openWindow(absolute);
  }
}

if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.messagingSenderId && FIREBASE_CONFIG.appId) {
  importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title = (payload.notification && payload.notification.title) || payload.data?.title || 'SheQueen';
      const body = (payload.notification && payload.notification.body) || payload.data?.body || 'You have a new update.';
      const url = payload.data?.url || '/';
      return self.registration.showNotification(title, {
        body,
        icon: '/web-app-manifest-192x192.png',
        badge: '/web-app-manifest-192x192.png',
        data: { url, type: payload.data?.type || '' },
        vibrate: [180, 80, 180, 80, 240],
      });
    });
  } catch (error) {
    console.warn('[SheQueen SW] FCM init skipped', error);
  }
}
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
