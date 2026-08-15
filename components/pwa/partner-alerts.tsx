'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, PhoneOff, ShoppingBag, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { subscribeOrdersForSupplier } from '@/lib/firebase/orders';
import { subscribeServiceBookingsForProvider } from '@/lib/firebase/service-bookings';
import { resolveUserPreferences } from '@/lib/account-settings';
import { formatUGX } from '@/lib/wholesale-data';
import { PROVIDER_HOME_HREF, SUPPLIER_HOME_HREF } from '@/lib/pwa/paths';
import { showPartnerNotification } from '@/lib/pwa/messaging';
import { startPartnerRing, stopPartnerRing } from '@/lib/pwa/sound';
import type { Order } from '@/lib/types/database';
import type { ServiceBooking } from '@/lib/types/services';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type IncomingCall = {
  id: string;
  kind: 'order' | 'booking';
  title: string;
  body: string;
  href: string;
};

function silenceRing() {
  stopPartnerRing();
}

export function PartnerAlerts() {
  const { supplierId, providerId, profile } = useAuth();
  const prefs = resolveUserPreferences(profile?.preferences);
  const enabled = prefs.pushAlerts !== false;
  const router = useRouter();
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const seenOrders = useRef<Set<string> | null>(null);
  const seenBookings = useRef<Set<string> | null>(null);
  const incomingRef = useRef<IncomingCall | null>(null);

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
      vibrate: [420, 160, 420, 900, 420, 160, 420, 900],
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
      const data = event.data as { type?: string; action?: string; url?: string } | null;
      if (!data || data.type !== 'partner-incoming') return;
      if (data.action === 'decline' || data.action === 'silence') {
        silenceRing();
        setIncoming(null);
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
  }, [router]);

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
      presentIncoming({
        id: newest.id,
        kind: 'order',
        title: 'Incoming order',
        body: `${newest.customerName || 'A customer'} · ${formatUGX(newest.total)}`,
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

  if (!incoming) return null;

  const Icon = incoming.kind === 'order' ? ShoppingBag : Sparkles;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <div
        className="pointer-events-none absolute inset-0 bg-background/55 backdrop-blur-[2px]"
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-labelledby="partner-incoming-title"
        aria-describedby="partner-incoming-body"
        className={cn(
          'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-[1.75rem]',
          'border border-border/70 bg-card shadow-[0_24px_80px_oklch(0.35_0.08_340_/_28%)]'
        )}
      >
        <div className="bg-gradient-to-b from-primary/[0.12] via-card to-card px-5 pb-5 pt-6 text-center">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />
            <span className="absolute inset-1 animate-pulse rounded-full bg-primary/15" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Icon className="h-6 w-6" />
            </span>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {incoming.kind === 'order' ? 'New order' : 'New booking'}
          </p>
          <h2 id="partner-incoming-title" className="mt-1 text-xl font-bold tracking-tight">
            {incoming.title}
          </h2>
          <p id="partner-incoming-body" className="mt-1 text-sm text-muted-foreground">
            {incoming.body}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border/60 bg-muted/20 p-4">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-full border-rose-200 bg-background text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            onClick={decline}
          >
            <PhoneOff className="h-4 w-4" />
            Decline
          </Button>
          <Button type="button" className="h-12 rounded-full" onClick={accept}>
            <Phone className="h-4 w-4" />
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
