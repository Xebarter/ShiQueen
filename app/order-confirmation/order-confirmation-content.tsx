'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Loader2 } from 'lucide-react';
import { getOrder, subscribeOrder } from '@/lib/firebase/orders';
import { Order } from '@/lib/types/database';
import {
  PaymentStatusActions,
  PaymentStatusPanel,
  type PaymentLiveKind,
} from '@/components/payments/payment-status-panel';
import { RetryPaymentButton } from '@/components/payments/retry-payment-button';
import { getOrderPayState } from '@/lib/payments/order-payment';

function giftSteps(paid: boolean): { label: string; state: 'done' | 'current' | 'todo' }[] {
  if (paid) {
    return [
      { label: 'Shared', state: 'done' },
      { label: 'Waiting', state: 'done' },
      { label: 'Paid', state: 'done' },
    ];
  }
  return [
    { label: 'Shared', state: 'done' },
    { label: 'Waiting', state: 'current' },
    { label: 'Paid', state: 'todo' },
  ];
}

export default function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentParam = searchParams.get('payment');
  const giftQuery = searchParams.get('gift') === '1';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeOrder(orderId, (next) => {
      setOrder(next);
      setLoading(false);
    });

    const poll = window.setInterval(() => {
      void getOrder(orderId).then((next) => {
        if (!next) return;
        setOrder(next);
        if (next.paymentStatus === 'paid' || next.paymentStatus === 'failed' || next.paymentStatus === 'cancelled') {
          window.clearInterval(poll);
        }
      });
    }, 4000);

    return () => {
      unsubscribe();
      window.clearInterval(poll);
    };
  }, [orderId]);

  const isGift = giftQuery || Boolean(order?.giftPayment);
  const pay = order ? getOrderPayState(order) : null;
  const paid = pay?.kind === 'paid';
  const failed = pay?.kind === 'failed';
  const offline = paymentParam === 'offline';
  const canRetry = Boolean(order && pay?.canRetry);

  const view = useMemo(() => {
    if (offline) {
      return {
        kind: 'waiting' as PaymentLiveKind,
        title: 'Saved',
        detail: isGift ? 'We’ll confirm the gift payment.' : 'We’ll confirm payment.',
        live: false,
      };
    }
    if (failed) {
      return {
        kind: 'failed' as PaymentLiveKind,
        title: 'Failed',
        detail: 'Tap Pay.',
        live: false,
      };
    }
    if (paid) {
      return {
        kind: 'paid' as PaymentLiveKind,
        title: 'Paid',
        detail: isGift ? 'Gift received.' : 'Order confirmed.',
        live: false,
      };
    }
    return {
      kind: 'waiting' as PaymentLiveKind,
      title: 'Waiting',
      detail: canRetry ? 'Tap Pay.' : isGift ? 'Not paid yet.' : 'Approve on your phone.',
      live: !canRetry,
    };
  }, [canRetry, failed, isGift, offline, paid]);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden py-12 px-4 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,oklch(0.74_0.12_62_/_0.16),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-lg">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <PaymentStatusPanel
              kind={view.kind}
              title={view.title}
              detail={view.detail}
              amount={order?.total}
              reference={order?.id ?? orderId}
              gift={isGift}
              live={view.live}
              steps={isGift ? giftSteps(paid) : undefined}
              actions={
                canRetry && order ? (
                  <>
                    <RetryPaymentButton orderId={order.id} gift={isGift} />
                    <PaymentStatusActions
                      primaryHref="/account"
                      primaryLabel="Orders"
                      showPrimary={false}
                      secondaryHref="/account"
                      secondaryLabel="Orders"
                    />
                  </>
                ) : (
                  <PaymentStatusActions primaryHref="/account" primaryLabel="Orders" />
                )
              }
            />
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
