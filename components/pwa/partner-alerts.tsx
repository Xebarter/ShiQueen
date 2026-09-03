'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { subscribeOrdersForSupplier } from '@/lib/firebase/orders';
import { subscribeServiceBookingsForProvider } from '@/lib/firebase/service-bookings';
import { resolveUserPreferences } from '@/lib/account-settings';
import { formatUGX } from '@/lib/wholesale-data';
import { PROVIDER_HOME_HREF, SUPPLIER_HOME_HREF } from '@/lib/pwa/paths';
import {
  registerPartnerPushToken,
  requestPartnerNotificationPermission,
  showPartnerNotification,
} from '@/lib/pwa/messaging';
import { INCOMING_VIBRATE_PATTERN, startPartnerRing, stopPartnerRing } from '@/lib/pwa/sound';
import { FOREGROUND_PUSH_EVENT, type IncomingPushPayload } from '@/lib/pwa/incoming';
import type { Order } from '@/lib/types/database';
import type { ServiceBooking } from '@/lib/types/services';
import { Button } from '@/components/ui/button';
import {
  IncomingCallOverlay,
  type IncomingAlert,
} from '@/components/pwa/incoming-call-overlay';

type IncomingCall = IncomingAlert;

const PROMPT_KEY = 'shequeen-partner-notify-prompt';

function silenceRing() {
  stopPartnerRing();
}

export function PartnerAlerts() {
  const { user, supplierId, providerId, profile } = useAuth();
  const prefs = resolveUserPreferences(profile?.preferences);
  const enabled = prefs.pushAlerts !== false;
  const router = useRouter();
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [promptHidden, setPromptHidden] = useState(true);
  const seenOrders = useRef<Set<string> | null>(null);
  const seenBookings = useRef<Set<string> | null>(null);
  const incomingRef = useRef<IncomingCall | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
    setPromptHidden(window.localStorage.getItem(PROMPT_KEY) === 'hidden');
  }, []);

  useEffect(() => {
    incomingRef.current = incoming;
  }, [incoming]);

  const presentIncoming = (next: IncomingCall) => {
    setIncoming(next);
    startPartnerRing();
    void showPartnerNotification(next.title, {
      body: next.body,
      url: next.href,
      tag: `incoming-${next.kind}-${next.id}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [...INCOMING_VIBRATE_PATTERN],
      data: { type: next.kind, id: next.id, url: next.href },
      actions: [
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' },
      ],
    });
  };

  const decline = () => {
    silenceRing();
    setIncoming(null);
  };

  const accept = () => {
    const current = incomingRef.current;
    silenceRing();
    setIncoming(null);
    if (current?.href) {
      router.push(current.href);
    }
  };

  // Silence like a phone: power button / screen off / app backgrounded.
  useEffect(() => {
    if (!incoming) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        silenceRing();
      }
    };
    const onPageHide = () => silenceRing();
    const onBlur = () => {
      // Many devices fire blur when the power button locks the screen.
      if (document.visibilityState === 'hidden') {
        silenceRing();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') decline();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('blur', onBlur);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [incoming]);

  // Service worker Accept / Decline (notification action buttons).
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        action?: string;
        url?: string;
        kind?: string;
        title?: string;
        body?: string;
      } | null;
      if (!data || data.type !== 'partner-incoming') return;
      if (data.action === 'decline' || data.action === 'silence') {
        silenceRing();
        setIncoming(null);
        return;
      }
      if (data.action === 'ring') {
        const isBooking = data.kind === 'booking';
        if (isBooking && !providerId) return;
        if (!isBooking && !supplierId) return;
        if (data.url && data.title) {
          presentIncoming({
            id: data.url,
            kind: isBooking ? 'booking' : 'order',
            title: data.title,
            body: data.body || '',
            href: data.url,
          });
        } else {
          startPartnerRing();
        }
        return;
      }
      if (data.action === 'accept') {
        silenceRing();
        setIncoming(null);
        if (data.url) router.push(data.url);
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [router, supplierId, providerId]);

  useEffect(() => {
    return () => silenceRing();
  }, []);

  useEffect(() => {
    if (!enabled || !supplierId) return;
    return subscribeOrdersForSupplier(supplierId, (orders: Order[]) => {
      const ids = new Set(orders.map((o) => o.id));
      if (!seenOrders.current) {
        seenOrders.current = ids;
        return;
      }
      const fresh = orders.filter((o) => !seenOrders.current!.has(o.id));
      seenOrders.current = ids;
      const newest = fresh[0];
      if (!newest) return;
      const theirItems = newest.items.filter((item) => item.supplierId === supplierId);
      const theirTotal = theirItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const preview = theirItems
        .map((item) => item.name)
        .filter(Boolean)
        .slice(0, 2)
        .join(', ');
      presentIncoming({
        id: newest.id,
        kind: 'order',
        title: 'Incoming order',
        body: `${newest.customerName || 'A customer'}${preview ? ` · ${preview}` : ''} · ${formatUGX(theirTotal || newest.total)}`,
        href: SUPPLIER_HOME_HREF,
      });
    });
  }, [enabled, supplierId]);

  useEffect(() => {
    if (!enabled || !providerId) return;
    return subscribeServiceBookingsForProvider(providerId, (bookings: ServiceBooking[]) => {
      const ids = new Set(bookings.map((b) => b.id));
      if (!seenBookings.current) {
        seenBookings.current = ids;
        return;
      }
      const fresh = bookings.filter((b) => !seenBookings.current!.has(b.id));
      seenBookings.current = ids;
      const newest = fresh[0];
      if (!newest) return;
      presentIncoming({
        id: newest.id,
        kind: 'booking',
        title: 'Incoming booking',
        body: `${newest.customerName || 'A customer'} · ${newest.serviceName}`,
        href: `${PROVIDER_HOME_HREF}/${newest.id}`,
      });
    });
  }, [enabled, providerId]);

  useEffect(() => {
    if (!enabled) return;
    const onPush = (event: Event) => {
      const detail = (event as CustomEvent<IncomingPushPayload>).detail;
      if (!detail?.type) return;
      if (detail.type === 'order' && supplierId) {
        presentIncoming({
          id: detail.tag || detail.url || 'order',
          kind: 'order',
          title: detail.title || 'Incoming order',
          body: detail.body || 'A customer placed an order',
          href: detail.url || SUPPLIER_HOME_HREF,
        });
      }
      if (detail.type === 'booking' && providerId) {
        presentIncoming({
          id: detail.tag || detail.url || 'booking',
          kind: 'booking',
          title: detail.title || 'Incoming booking',
          body: detail.body || 'A customer booked a service',
          href: detail.url || PROVIDER_HOME_HREF,
        });
      }
    };
    window.addEventListener(FOREGROUND_PUSH_EVENT, onPush);
    return () => window.removeEventListener(FOREGROUND_PUSH_EVENT, onPush);
  }, [enabled, supplierId, providerId]);

  if (!incoming) {
    const showPrompt =
      enabled && (Boolean(supplierId) || Boolean(providerId)) && permission === 'default' && !promptHidden;
    if (!showPrompt) return null;
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-3 md:bottom-6">
        <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-lg">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Order alerts</p>
            <p className="text-xs text-muted-foreground">
              Get a notification on this device when a customer orders your products.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  void (async () => {
                    const next = await requestPartnerNotificationPermission();
                    setPermission(next);
                    if (next === 'granted' && user?.uid) {
                      const { unlockPartnerAudio } = await import('@/lib/pwa/sound');
                      unlockPartnerAudio();
                      await registerPartnerPushToken(user.uid);
                    }
                    window.localStorage.setItem(PROMPT_KEY, 'hidden');
                    setPromptHidden(true);
                  })();
                }}
              >
                Enable
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  window.localStorage.setItem(PROMPT_KEY, 'hidden');
                  setPromptHidden(true);
                }}
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <IncomingCallOverlay incoming={incoming} onAccept={accept} onDecline={decline} />
  );
}
