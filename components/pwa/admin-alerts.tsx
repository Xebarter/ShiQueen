'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { useServices } from '@/lib/services-context';
import { resolveUserPreferences } from '@/lib/account-settings';
import {
  ADMIN_MESSAGES_HREF,
  ADMIN_ORDERS_HREF,
  ADMIN_REVIEWS_HREF,
  ADMIN_SERVICE_BOOKINGS_HREF,
  ADMIN_SERVICE_PROVIDERS_HREF,
  ADMIN_SUPPLIERS_HREF,
  ADMIN_WHOLESALE_HREF,
  ADMIN_WHOLESALE_ORDERS_HREF,
} from '@/lib/pwa/paths';
import {
  registerPartnerPushToken,
  requestPartnerNotificationPermission,
  showPartnerNotification,
} from '@/lib/pwa/messaging';
import {
  INCOMING_VIBRATE_PATTERN,
  playPartnerChime,
  startPartnerRing,
  stopPartnerRing,
  vibratePartnerAlert,
} from '@/lib/pwa/sound';
import { FOREGROUND_PUSH_EVENT, type IncomingPushPayload } from '@/lib/pwa/incoming';
import { subscribeContactMessages } from '@/lib/firebase/contact-messages';
import { subscribeOrders } from '@/lib/firebase/orders';
import { subscribeProductReviews } from '@/lib/firebase/product-reviews';
import { subscribeBulkOrders, subscribeWholesaleAccounts } from '@/lib/firebase/wholesale';
import type { ContactMessage } from '@/lib/types/contact-messages';
import type { Order, ProductReview } from '@/lib/types/database';
import type { BulkOrder, WholesaleAccount } from '@/lib/types/wholesale';
import { Button } from '@/components/ui/button';
import {
  IncomingCallOverlay,
  type IncomingAlert,
} from '@/components/pwa/incoming-call-overlay';

type Banner = {
  id: string;
  title: string;
  body: string;
  href: string;
};

const PROMPT_KEY = 'shequeen-admin-notify-prompt';

function fireAlert(banner: Banner, notify: boolean) {
  playPartnerChime();
  vibratePartnerAlert();
  if (notify) {
    void showPartnerNotification(banner.title, {
      body: banner.body,
      url: banner.href,
      tag: banner.id,
      silent: false,
      renotify: true,
    });
  }
}

function pendingIds(items: Array<{ id: string; approvalStatus?: string }>) {
  return new Set(items.filter((item) => item.approvalStatus === 'pending').map((item) => item.id));
}

export function AdminAlerts() {
  const { user, isAdmin, profile } = useAuth();
  const router = useRouter();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { providers, bookings, loading: servicesLoading } = useServices();
  const prefs = resolveUserPreferences(profile?.preferences);
  const enabled = isAdmin && prefs.pushAlerts !== false;
  const [banner, setBanner] = useState<Banner | null>(null);
  const [incoming, setIncoming] = useState<IncomingAlert | null>(null);
  const incomingRef = useRef<IncomingAlert | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [promptHidden, setPromptHidden] = useState(true);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [contactLoading, setContactLoading] = useState(true);
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [bulkLoading, setBulkLoading] = useState(true);
  const [wholesaleAccounts, setWholesaleAccounts] = useState<WholesaleAccount[]>([]);
  const [wholesaleLoading, setWholesaleLoading] = useState(true);
  const seenSuppliers = useRef<Set<string> | null>(null);
  const seenProviders = useRef<Set<string> | null>(null);
  const seenMessages = useRef<Set<string> | null>(null);
  const seenFlags = useRef<Set<string> | null>(null);
  const seenOrders = useRef<Set<string> | null>(null);
  const seenBookings = useRef<Set<string> | null>(null);
  const seenBulk = useRef<Set<string> | null>(null);
  const seenWholesale = useRef<Set<string> | null>(null);

  useEffect(() => {
    incomingRef.current = incoming;
  }, [incoming]);

  const silenceIncoming = () => {
    stopPartnerRing();
    setIncoming(null);
  };

  const presentIncoming = (next: IncomingAlert) => {
    setBanner(null);
    setIncoming(next);
    startPartnerRing();
    void showPartnerNotification(next.title, {
      body: next.body,
      url: next.href,
      tag: `incoming-${next.kind}-${next.id}`,
      silent: false,
      renotify: true,
      requireInteraction: true,
      vibrate: [...INCOMING_VIBRATE_PATTERN],
      data: { type: next.kind === 'booking' ? 'admin_booking' : 'admin_order', id: next.id, url: next.href },
      actions: [
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' },
      ],
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
    setPromptHidden(window.localStorage.getItem(PROMPT_KEY) === 'hidden');
  }, []);

  useEffect(() => {
    if (!enabled) {
      setContactMessages([]);
      setContactLoading(false);
      setProductReviews([]);
      setReviewsLoading(false);
      setOrders([]);
      setOrdersLoading(false);
      setBulkOrders([]);
      setBulkLoading(false);
      setWholesaleAccounts([]);
      setWholesaleLoading(false);
      return;
    }

    setContactLoading(true);
    setReviewsLoading(true);
    setOrdersLoading(true);
    setBulkLoading(true);
    setWholesaleLoading(true);

    const unsubs = [
      subscribeContactMessages(
        (next) => {
          setContactMessages(next);
          setContactLoading(false);
        },
        () => setContactLoading(false)
      ),
      subscribeProductReviews(
        (next) => {
          setProductReviews(next);
          setReviewsLoading(false);
        },
        () => setReviewsLoading(false)
      ),
      subscribeOrders(
        (next) => {
          setOrders(next);
          setOrdersLoading(false);
        },
        () => setOrdersLoading(false)
      ),
      subscribeBulkOrders(
        (next) => {
          setBulkOrders(next);
          setBulkLoading(false);
        },
        () => setBulkLoading(false)
      ),
      subscribeWholesaleAccounts(
        (next) => {
          setWholesaleAccounts(next);
          setWholesaleLoading(false);
        },
        () => setWholesaleLoading(false)
      ),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [enabled]);

  const showBanner = (next: Banner) => {
    silenceIncoming();
    setBanner(next);
    fireAlert(next, true);
  };

  useEffect(() => {
    if (!enabled || suppliersLoading) return;
    const ids = pendingIds(suppliers);
    if (!seenSuppliers.current) {
      seenSuppliers.current = ids;
      return;
    }
    const fresh = suppliers.filter(
      (supplier) => supplier.approvalStatus === 'pending' && !seenSuppliers.current!.has(supplier.id)
    );
    seenSuppliers.current = ids;
    const newest = fresh[0];
    if (!newest) return;
    showBanner({
      id: `approval-supplier-${newest.id}`,
      title: fresh.length > 1 ? `${fresh.length} new supplier requests` : 'New supplier approval request',
      body:
        fresh.length > 1
          ? `${newest.companyName || newest.name} and ${fresh.length - 1} more are waiting`
          : `${newest.companyName || newest.name} is waiting for approval`,
      href: ADMIN_SUPPLIERS_HREF,
    });
  }, [enabled, suppliers, suppliersLoading]);

  useEffect(() => {
    if (!enabled || servicesLoading) return;
    const ids = pendingIds(providers);
    if (!seenProviders.current) {
      seenProviders.current = ids;
      return;
    }
    const fresh = providers.filter(
      (provider) => provider.approvalStatus === 'pending' && !seenProviders.current!.has(provider.id)
    );
    seenProviders.current = ids;
    const newest = fresh[0];
    if (!newest) return;
    showBanner({
      id: `approval-provider-${newest.id}`,
      title: fresh.length > 1 ? `${fresh.length} new provider requests` : 'New provider approval request',
      body:
        fresh.length > 1
          ? `${newest.businessName || newest.name} and ${fresh.length - 1} more are waiting`
          : `${newest.businessName || newest.name} is waiting for approval`,
      href: ADMIN_SERVICE_PROVIDERS_HREF,
    });
  }, [enabled, providers, servicesLoading]);

  useEffect(() => {
    if (!enabled || contactLoading) return;
    const ids = new Set(contactMessages.map((message) => message.id));
    if (!seenMessages.current) {
      seenMessages.current = ids;
      return;
    }
    const fresh = contactMessages.filter((message) => !seenMessages.current!.has(message.id));
    seenMessages.current = ids;
    const newest = fresh[0];
    if (!newest) return;
    const isAd = newest.topic === 'advertise';
    showBanner({
      id: `contact-${newest.id}`,
      title: isAd
        ? fresh.length > 1
          ? `${fresh.length} advertising requests`
          : 'New advertising request'
        : fresh.length > 1
          ? `${fresh.length} new contact messages`
          : 'New contact message',
      body:
        fresh.length > 1
          ? `${newest.name}: ${newest.subject} (+${fresh.length - 1} more)`
          : `${newest.name}: ${newest.subject}`,
      href: `${ADMIN_MESSAGES_HREF}?id=${encodeURIComponent(newest.id)}`,
    });
  }, [enabled, contactMessages, contactLoading]);

  useEffect(() => {
    if (!enabled || reviewsLoading) return;
    const flagged = productReviews.filter((review) => review.flagStatus === 'pending');
    const ids = new Set(flagged.map((review) => review.id));
    if (!seenFlags.current) {
      seenFlags.current = ids;
      return;
    }
    const fresh = flagged.filter((review) => !seenFlags.current!.has(review.id));
    seenFlags.current = ids;
    const newest = fresh[0];
    if (!newest) return;
    showBanner({
      id: `review-flag-${newest.id}`,
      title: fresh.length > 1 ? `${fresh.length} reviews flagged` : 'Product review flagged',
      body:
        fresh.length > 1
          ? `${newest.customerName || 'A customer'} review needs moderation (+${fresh.length - 1} more)`
          : `${newest.customerName || 'A customer'}: ${newest.title || newest.comment.slice(0, 80)}`,
      href: ADMIN_REVIEWS_HREF,
    });
  }, [enabled, productReviews, reviewsLoading]);

  useEffect(() => {
    if (!enabled || ordersLoading) return;
    const ids = new Set(orders.map((order) => order.id));
    if (!seenOrders.current) {
      seenOrders.current = ids;
      return;
    }
    const fresh = orders.filter((order) => !seenOrders.current!.has(order.id));
    seenOrders.current = ids;
    const newest = fresh[0];
    if (!newest) return;
    presentIncoming({
      id: newest.id,
      kind: 'order',
      title: fresh.length > 1 ? `${fresh.length} new orders` : 'Incoming order',
      body:
        fresh.length > 1
          ? `${newest.customerName} and ${fresh.length - 1} more`
          : `${newest.customerName} · UGX ${newest.total.toLocaleString('en-UG')}`,
      href: `${ADMIN_ORDERS_HREF}?order=${encodeURIComponent(newest.id)}`,
    });
  }, [enabled, orders, ordersLoading]);

  useEffect(() => {
    if (!enabled || servicesLoading) return;
    const ids = new Set(bookings.map((booking) => booking.id));
    if (!seenBookings.current) {
      seenBookings.current = ids;
      return;
    }
    const fresh = bookings.filter((booking) => !seenBookings.current!.has(booking.id));
    seenBookings.current = ids;
    const newest = fresh[0];
    if (!newest) return;
    presentIncoming({
      id: newest.id,
      kind: 'booking',
      title: fresh.length > 1 ? `${fresh.length} new bookings` : 'Incoming booking',
      body:
        fresh.length > 1
          ? `${newest.customerName} and ${fresh.length - 1} more`
          : `${newest.customerName} booked ${newest.serviceName}`,
      href: `${ADMIN_SERVICE_BOOKINGS_HREF}&id=${encodeURIComponent(newest.id)}`,
    });
  }, [enabled, bookings, servicesLoading]);

  useEffect(() => {
    if (!enabled || bulkLoading) return;
    const pending = bulkOrders.filter((order) => order.status === 'pending');
    const ids = new Set(pending.map((order) => order.id));
    if (!seenBulk.current) {
      seenBulk.current = ids;
      return;
    }
    const fresh = pending.filter((order) => !seenBulk.current!.has(order.id));
    seenBulk.current = ids;
    const newest = fresh[0];
    if (!newest) return;
    showBanner({
      id: `bulk-order-${newest.id}`,
      title: fresh.length > 1 ? `${fresh.length} wholesale orders` : 'New wholesale order',
      body: `Bulk order · UGX ${newest.totalAmount.toLocaleString('en-UG')}`,
      href: ADMIN_WHOLESALE_ORDERS_HREF,
    });
  }, [enabled, bulkOrders, bulkLoading]);

  useEffect(() => {
    if (!enabled || wholesaleLoading) return;
    const pending = wholesaleAccounts.filter((account) => account.status === 'pending');
    const ids = new Set(pending.map((account) => account.id));
    if (!seenWholesale.current) {
      seenWholesale.current = ids;
      return;
    }
    const fresh = pending.filter((account) => !seenWholesale.current!.has(account.id));
    seenWholesale.current = ids;
    const newest = fresh[0];
    if (!newest) return;
    showBanner({
      id: `wholesale-account-${newest.id}`,
      title: fresh.length > 1 ? `${fresh.length} wholesale applications` : 'New wholesale application',
      body: `${newest.companyName} applied for wholesale access`,
      href: ADMIN_WHOLESALE_HREF,
    });
  }, [enabled, wholesaleAccounts, wholesaleLoading]);

  useEffect(() => {
    return () => stopPartnerRing();
  }, []);

  useEffect(() => {
    if (!enabled) return;
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
        silenceIncoming();
        return;
      }
      if (data.action === 'ring') {
        presentIncoming({
          id: data.url || 'admin-incoming',
          kind: data.kind === 'booking' ? 'booking' : 'order',
          title: data.title || (data.kind === 'booking' ? 'Incoming booking' : 'Incoming order'),
          body: data.body || 'A customer just checked out',
          href: data.url || ADMIN_ORDERS_HREF,
        });
        return;
      }
      if (data.action === 'accept') {
        const href = data.url || incomingRef.current?.href;
        silenceIncoming();
        if (href) router.push(href);
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [enabled, router]);

  useEffect(() => {
    if (!enabled) return;
    const onPush = (event: Event) => {
      const detail = (event as CustomEvent<IncomingPushPayload>).detail;
      if (detail?.type === 'admin_order') {
        presentIncoming({
          id: detail.tag || detail.url || 'admin-order',
          kind: 'order',
          title: detail.title || 'Incoming order',
          body: detail.body || 'A customer placed an order',
          href: detail.url || ADMIN_ORDERS_HREF,
        });
      }
      if (detail?.type === 'admin_booking') {
        presentIncoming({
          id: detail.tag || detail.url || 'admin-booking',
          kind: 'booking',
          title: detail.title || 'Incoming booking',
          body: detail.body || 'A customer booked a service',
          href: detail.url || ADMIN_SERVICE_BOOKINGS_HREF,
        });
      }
    };
    window.addEventListener(FOREGROUND_PUSH_EVENT, onPush);
    return () => window.removeEventListener(FOREGROUND_PUSH_EVENT, onPush);
  }, [enabled]);

  const enableNotifications = async () => {
    const next = await requestPartnerNotificationPermission();
    setPermission(next);
    if (next === 'granted' && user?.uid) {
      const { unlockPartnerAudio } = await import('@/lib/pwa/sound');
      unlockPartnerAudio();
      await registerPartnerPushToken(user.uid);
    }
    window.localStorage.setItem(PROMPT_KEY, 'hidden');
    setPromptHidden(true);
  };

  const dismissPrompt = () => {
    window.localStorage.setItem(PROMPT_KEY, 'hidden');
    setPromptHidden(true);
  };

  const showPrompt = enabled && permission === 'default' && !promptHidden;

  return (
    <>
      {showPrompt ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-3 md:bottom-6">
          <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-lg">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Admin alerts</p>
              <p className="text-xs text-muted-foreground">
                Get notified for orders, bookings, wholesale activity, messages, ads requests, and
                approvals on this device.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void enableNotifications()}>
                  Enable
                </Button>
                <Button size="sm" variant="ghost" onClick={dismissPrompt}>
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {banner ? (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-3 md:top-4">
          <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-lg">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </span>
            <Link
              href={banner.href}
              className="min-w-0 flex-1"
              onClick={() => {
                stopPartnerRing();
                setBanner(null);
              }}
            >
              <p className="text-sm font-semibold">{banner.title}</p>
              <p className="text-xs text-muted-foreground">{banner.body}</p>
            </Link>
            <button
              type="button"
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              onClick={() => {
                stopPartnerRing();
                setBanner(null);
              }}
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
      {incoming ? (
        <IncomingCallOverlay
          incoming={incoming}
          onAccept={() => {
            const href = incomingRef.current?.href;
            silenceIncoming();
            if (href) router.push(href);
          }}
          onDecline={silenceIncoming}
        />
      ) : null}
    </>
  );
}
