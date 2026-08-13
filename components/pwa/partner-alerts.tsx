'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { subscribeOrdersForSupplier } from '@/lib/firebase/orders';
import { subscribeServiceBookingsForProvider } from '@/lib/firebase/service-bookings';
import { resolveUserPreferences } from '@/lib/account-settings';
import { formatUGX } from '@/lib/wholesale-data';
import { PROVIDER_HOME_HREF, SUPPLIER_HOME_HREF } from '@/lib/pwa/paths';
import { showPartnerNotification } from '@/lib/pwa/messaging';
import { playPartnerChime, vibratePartnerAlert } from '@/lib/pwa/sound';
import type { Order } from '@/lib/types/database';
import type { ServiceBooking } from '@/lib/types/services';

type Banner = {
  id: string;
  title: string;
  body: string;
  href: string;
};

function fireAlert(banner: Banner, notify: boolean) {
  playPartnerChime();
  vibratePartnerAlert();
  if (notify) {
    void showPartnerNotification(banner.title, { body: banner.body, url: banner.href });
  }
}

export function PartnerAlerts() {
  const { supplierId, providerId, profile } = useAuth();
  const prefs = resolveUserPreferences(profile?.preferences);
  const enabled = prefs.pushAlerts !== false;
  const [banner, setBanner] = useState<Banner | null>(null);
  const seenOrders = useRef<Set<string> | null>(null);
  const seenBookings = useRef<Set<string> | null>(null);

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
      const next: Banner = {
        id: newest.id,
        title: 'New order',
        body: `${newest.customerName || 'A customer'} · ${formatUGX(newest.total)}`,
        href: SUPPLIER_HOME_HREF,
      };
      setBanner(next);
      fireAlert(next, true);
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
      const next: Banner = {
        id: newest.id,
        title: 'New booking',
        body: `${newest.customerName || 'A customer'} booked ${newest.serviceName}`,
        href: `${PROVIDER_HOME_HREF}/${newest.id}`,
      };
      setBanner(next);
      fireAlert(next, true);
    });
  }, [enabled, providerId]);

  if (!banner) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-3 md:top-4">
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-lg">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bell className="h-4 w-4" />
        </span>
        <Link href={banner.href} className="min-w-0 flex-1" onClick={() => setBanner(null)}>
          <p className="text-sm font-semibold">{banner.title}</p>
          <p className="text-xs text-muted-foreground">{banner.body}</p>
        </Link>
        <button
          type="button"
          className="rounded-full p-1 text-muted-foreground hover:bg-muted"
          onClick={() => setBanner(null)}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
