'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { useServices } from '@/lib/services-context';
import { resolveUserPreferences } from '@/lib/account-settings';
import { ADMIN_SERVICE_PROVIDERS_HREF, ADMIN_SUPPLIERS_HREF } from '@/lib/pwa/paths';
import {
  registerPartnerPushToken,
  requestPartnerNotificationPermission,
  showPartnerNotification,
} from '@/lib/pwa/messaging';
import { playPartnerChime, vibratePartnerAlert } from '@/lib/pwa/sound';
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
  const { providers, loading: servicesLoading } = useServices();
  const prefs = resolveUserPreferences(profile?.preferences);
  const enabled = isAdmin && prefs.pushAlerts !== false;
  const [banner, setBanner] = useState<Banner | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [promptHidden, setPromptHidden] = useState(true);
  const seenSuppliers = useRef<Set<string> | null>(null);
  const seenProviders = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
    setPromptHidden(window.localStorage.getItem(PROMPT_KEY) === 'hidden');
  }, []);

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
    const next: Banner = {
      id: `approval-supplier-${newest.id}`,
      title: fresh.length > 1 ? `${fresh.length} new supplier requests` : 'New supplier approval request',
      body:
        fresh.length > 1
          ? `${newest.companyName || newest.name} and ${fresh.length - 1} more are waiting`
          : `${newest.companyName || newest.name} is waiting for approval`,
      href: ADMIN_SUPPLIERS_HREF,
    };
    setBanner(next);
    fireAlert(next, true);
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
    const next: Banner = {
      id: `approval-provider-${newest.id}`,
      title: fresh.length > 1 ? `${fresh.length} new provider requests` : 'New provider approval request',
      body:
        fresh.length > 1
          ? `${newest.businessName || newest.name} and ${fresh.length - 1} more are waiting`
          : `${newest.businessName || newest.name} is waiting for approval`,
      href: ADMIN_SERVICE_PROVIDERS_HREF,
    };
    setBanner(next);
    fireAlert(next, true);
  }, [enabled, providers, servicesLoading]);

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
              <p className="text-sm font-semibold">Approval alerts</p>
              <p className="text-xs text-muted-foreground">
                Get a notification on this device when a supplier or provider requests approval.
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
