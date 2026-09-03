'use client';

import { useEffect, useState } from 'react';

export type GiftShareLiveStatus = 'pending' | 'paid' | 'expired';

export type GiftShareLive = {
  status: GiftShareLiveStatus;
  orderId?: string;
  bookingId?: string;
};

export function tokenFromShareUrl(shareUrl: string): string | null {
  try {
    const url = new URL(
      shareUrl,
      typeof window !== 'undefined' ? window.location.origin : 'https://www.shiqueen.com'
    );
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.at(-1) || null;
  } catch {
    return null;
  }
}

export function useGiftShareWatch(
  shareUrl: string | null,
  kind: 'checkout' | 'booking'
): GiftShareLive {
  const [live, setLive] = useState<GiftShareLive>({ status: 'pending' });

  useEffect(() => {
    if (!shareUrl) {
      setLive({ status: 'pending' });
      return;
    }

    const token = tokenFromShareUrl(shareUrl);
    if (!token) return;

    let cancelled = false;
    let intervalId: number | undefined;
    const endpoint =
      kind === 'checkout'
        ? `/api/checkout/share/${encodeURIComponent(token)}`
        : `/api/services/book/share/${encodeURIComponent(token)}`;

    const stop = () => {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const tick = async () => {
      try {
        const response = await fetch(endpoint);
        const data = (await response.json()) as {
          requiresClientRead?: boolean;
          status?: GiftShareLiveStatus;
          orderId?: string;
          bookingId?: string;
        };
        if (cancelled) return;

        let next: GiftShareLive | null = null;

        if (data.requiresClientRead) {
          if (kind === 'checkout') {
            const { getSharedCheckoutById } = await import('@/lib/firebase/shared-checkouts');
            const stored = await getSharedCheckoutById(token);
            if (!stored || cancelled) return;
            next = { status: stored.status, orderId: stored.orderId };
          } else {
            const { getSharedBookingById } = await import('@/lib/firebase/shared-bookings');
            const stored = await getSharedBookingById(token);
            if (!stored || cancelled) return;
            next = { status: stored.status, bookingId: stored.bookingId };
          }
        } else if (response.ok) {
          next = {
            status:
              data.status === 'paid' || data.status === 'expired' ? data.status : 'pending',
            orderId: data.orderId,
            bookingId: data.bookingId,
          };
        }

        if (!next) return;
        setLive(next);
        if (next.status === 'paid' || next.status === 'expired') stop();
      } catch {
        /* ignore poll errors */
      }
    };

    void tick();
    intervalId = window.setInterval(() => {
      void tick();
    }, 4000);

    return () => {
      cancelled = true;
      stop();
    };
  }, [shareUrl, kind]);

  return live;
}
