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

  const body = `/* ShiQueen partner PWA service worker */
const FIREBASE_CONFIG = ${JSON.stringify(config)};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {});

async function postToClients(message) {
  const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windowClients) {
    client.postMessage(message);
  }
}

self.addEventListener('notificationclick', (event) => {
  const data = (event.notification && event.notification.data) || {};
  const targetUrl = data.url || '/';
  const type = data.type || '';
  const isIncoming = type === 'order' || type === 'booking';
  event.notification.close();

  if (event.action === 'decline') {
    event.waitUntil(
      postToClients({ type: 'partner-incoming', action: 'decline' })
    );
    return;
  }

  const action = event.action === 'accept' || isIncoming ? 'accept' : 'silence';
  event.waitUntil(
    Promise.all([
      postToClients({ type: 'partner-incoming', action, url: targetUrl }),
      openOrFocus(targetUrl),
    ])
  );
});

self.addEventListener('notificationclose', (event) => {
  const data = (event.notification && event.notification.data) || {};
  const type = data.type || '';
  if (type === 'order' || type === 'booking') {
    event.waitUntil(postToClients({ type: 'partner-incoming', action: 'silence' }));
  }
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
      const title = (payload.notification && payload.notification.title) || payload.data?.title || 'ShiQueen';
      const body = (payload.notification && payload.notification.body) || payload.data?.body || 'You have a new update.';
      const url = payload.data?.url || '/';
      const type = payload.data?.type || '';
      const tag = payload.data?.tag || type || 'shequeen';
      const isIncoming = type === 'order' || type === 'booking';
      return self.registration.showNotification(title, {
        body,
        icon: '/web-app-manifest-192x192.png',
        badge: '/web-app-manifest-192x192.png',
        tag,
        renotify: true,
        requireInteraction: isIncoming,
        data: { url, type },
        vibrate: isIncoming
          ? [420, 160, 420, 900, 420, 160, 420, 900]
          : [180, 80, 180, 80, 240],
        actions: isIncoming
          ? [
              { action: 'accept', title: 'Accept' },
              { action: 'decline', title: 'Decline' },
            ]
          : undefined,
      });
    });
  } catch (error) {
    console.warn('[ShiQueen SW] FCM init skipped', error);
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
