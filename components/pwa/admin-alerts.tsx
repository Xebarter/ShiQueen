'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
import { playPartnerChime, vibratePartnerAlert } from '@/lib/pwa/sound';
import { subscribeContactMessages } from '@/lib/firebase/contact-messages';
import { subscribeOrders } from '@/lib/firebase/orders';
import { subscribeProductReviews } from '@/lib/firebase/product-reviews';
import { subscribeBulkOrders, subscribeWholesaleAccounts } from '@/lib/firebase/wholesale';
import type { ContactMessage } from '@/lib/types/contact-messages';
import type { Order, ProductReview } from '@/lib/types/database';
import type { BulkOrder, WholesaleAccount } from '@/lib/types/wholesale';
import { Button } from '@/components/ui/button';

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
    });
  }
}

function pendingIds(items: Array<{ id: string; approvalStatus?: string }>) {
  return new Set(items.filter((item) => item.approvalStatus === 'pending').map((item) => item.id));
}

export function AdminAlerts() {
  const { user, isAdmin, profile } = useAuth();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { providers, bookings, loading: servicesLoading } = useServices();
  const prefs = resolveUserPreferences(profile?.preferences);
  const enabled = isAdmin && prefs.pushAlerts !== false;
  const [banner, setBanner] = useState<Banner | null>(null);
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
    showBanner({
      id: `admin-order-${newest.id}`,
      title: fresh.length > 1 ? `${fresh.length} new orders` : 'New ShiQueen order',
      body:
        fresh.length > 1
          ? `${newest.customerName} and ${fresh.length - 1} more`
          : `${newest.customerName} · UGX ${newest.total.toLocaleString('en-UG')}`,
      href: ADMIN_ORDERS_HREF,
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
    showBanner({
      id: `admin-booking-${newest.id}`,
      title: fresh.length > 1 ? `${fresh.length} new bookings` : 'New service booking',
      body:
        fresh.length > 1
          ? `${newest.customerName} and ${fresh.length - 1} more`
          : `${newest.customerName} booked ${newest.serviceName}`,
      href: ADMIN_SERVICE_BOOKINGS_HREF,
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

  const enableNotifications = async () => {
    const next = await requestPartnerNotificationPermission();
    setPermission(next);
    if (next === 'granted' && user?.uid) {
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
      ) : null}
    </>
  );
}
