'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  CreditCard,
  Gift,
  Loader2,
  ShoppingBag,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isRemoteProductImage } from '@/components/product-image';
import type { SharedCheckout, SharedCheckoutPublicView } from '@/lib/types/shared-checkout';
import { generateOrderId } from '@/lib/order-utils';
import { toSharedCheckoutPublicView } from '@/lib/shared-checkout-utils';
import { formatUGX } from '@/lib/wholesale-data';
import { useCommerceSettings } from '@/lib/commerce-settings-context';
import { OrderQuoteLines } from '@/components/checkout/order-quote-lines';

const fieldClass =
  'h-12 rounded-xl border-border/80 bg-background px-4 text-base shadow-sm transition-all placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/10 md:text-base';

interface SharedCheckoutPayPageProps {
  token: string;
}

export function SharedCheckoutPayPage({ token }: SharedCheckoutPayPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [checkout, setCheckout] = useState<SharedCheckoutPublicView | null>(null);
  const [checkoutData, setCheckoutData] = useState<SharedCheckout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [payMethod, setPayMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  const { quoteTotals, enabledMethods } = useCommerceSettings();

  useEffect(() => {
    const methods = enabledMethods.filter(
      (method): method is 'mobile_money' | 'card' => method === 'mobile_money' || method === 'card'
    );
    if (methods.length === 0) return;
    if (!methods.includes(payMethod)) {
      setPayMethod(methods[0]);
    }
  }, [enabledMethods, payMethod]);

  const loadCheckout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/checkout/share/${encodeURIComponent(token)}`);
      const data = await response.json();

      if (data.requiresClientRead) {
        const { getSharedCheckoutById } = await import('@/lib/firebase/shared-checkouts');
        const stored = await getSharedCheckoutById(token);
        if (!stored) {
          throw new Error('Payment link not found.');
        }
        setCheckoutData(stored);
        setCheckout(toSharedCheckoutPublicView(stored));
        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? 'Payment link not found.');
      }

      setCheckoutData(null);
      setCheckout(data as SharedCheckoutPublicView);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment link.');
      setCheckout(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCheckout();
  }, [loadCheckout]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkout || checkout.status !== 'pending') return;
    if (payMethod !== 'mobile_money' && payMethod !== 'card') return;
    if (!enabledMethods.includes(payMethod)) {
      toast.error('This payment method is not available.');
      return;
    }

    setPaying(true);
    try {
      let orderId = generateOrderId();
      let clientCheckout:
        | {
            recipientName: string;
            shippingAddress: SharedCheckout['shippingAddress'];
            orderItems: SharedCheckout['orderItems'];
            subtotal: number;
            total: number;
            orderType: SharedCheckout['orderType'];
            senderUserId?: string | null;
          }
        | undefined;

      if (checkoutData) {
        const { reserveSharedCheckoutForPayment } = await import('@/lib/firebase/shared-checkouts');
        const reservation = await reserveSharedCheckoutForPayment(token, orderId);

        if (reservation === 'not_found') {
          throw new Error('Payment link not found.');
        }
        if (reservation === 'paid') {
          await loadCheckout();
          throw new Error('This order has already been paid.');
        }
        if (reservation === 'expired') {
          await loadCheckout();
          throw new Error('This payment link has expired. Ask the sender to create a new one.');
        }
        if (reservation === 'in_progress') {
          throw new Error('A payment is already in progress for this link.');
        }

        clientCheckout = {
          recipientName: checkoutData.recipientName,
          shippingAddress: checkoutData.shippingAddress,
          orderItems: checkoutData.orderItems,
          subtotal: checkoutData.subtotal,
          total: checkoutData.total,
          orderType: checkoutData.orderType,
          senderUserId: checkoutData.senderUserId ?? null,
        };
      }

      const response = await fetch(`/api/checkout/share/${encodeURIComponent(token)}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          orderId,
          paymentMethod: payMethod,
          clientCheckout,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyPaid) {
          await loadCheckout();
        }
        throw new Error(data.error ?? 'Failed to start payment.');
      }

      if (data.requiresClientOrder && data.order) {
        const { createOrder } = await import('@/lib/firebase/orders');
        await createOrder(data.order);
      }

      if (data.requiresClientCheckoutUpdate && data.markSharedCheckoutPaid) {
        const { markSharedCheckoutPaid } = await import('@/lib/firebase/shared-checkouts');
        await markSharedCheckoutPaid(token, data.orderId as string);
      }

      if (data.stk?.status === 'pending' && data.orderId) {
        toast.success(
          data.stk.details?.message ?? 'Check your phone to approve the payment.'
        );
        router.push(`/order-confirmation?orderId=${encodeURIComponent(data.orderId)}&gift=1`);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl as string;
        return;
      }

      if (data.orderId) {
        router.push(`/order-confirmation?orderId=${encodeURIComponent(data.orderId)}&gift=1`);
        return;
      }

      throw new Error('No payment response received.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[50vh]">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !checkout) {
    return (
      <main>
        <Header />
        <section className="py-20 text-center">
          <div className="mx-auto max-w-md px-4">
            <h1 className="text-2xl font-light tracking-tight">Payment link unavailable</h1>
            <p className="mt-3 text-muted-foreground">{error ?? 'This link is invalid.'}</p>
            <Link href="/shop" className="mt-6 inline-block">
              <Button>Continue shopping</Button>
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  if (checkout.status === 'paid') {
    return (
      <main>
        <Header />
        <section className="py-20 text-center">
          <div className="mx-auto max-w-md px-4">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Gift className="h-7 w-7" />
            </span>
            <h1 className="text-2xl font-light tracking-tight">This order has been paid</h1>
            <p className="mt-3 text-muted-foreground">
              {checkout.recipientFirstName}&apos;s order is already covered. Thank you for checking!
            </p>
            {checkout.orderId && (
              <p className="mt-2 text-sm text-muted-foreground">
                Reference: {checkout.orderId}
              </p>
            )}
            <Link href="/shop" className="mt-6 inline-block">
              <Button variant="outline">Browse ShiQueen</Button>
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  if (checkout.status === 'expired') {
    return (
      <main>
        <Header />
        <section className="py-20 text-center">
          <div className="mx-auto max-w-md px-4">
            <h1 className="text-2xl font-light tracking-tight">This link has expired</h1>
            <p className="mt-3 text-muted-foreground">
              Ask {checkout.recipientFirstName} to create a new payment link from checkout.
            </p>
            <Link href="/shop" className="mt-6 inline-block">
              <Button>Continue shopping</Button>
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const quote = quoteTotals(checkout.subtotal);
  const giftMethods = enabledMethods.filter(
    (method): method is 'mobile_money' | 'card' => method === 'mobile_money' || method === 'card'
  );

  return (
    <main className="pb-28 md:pb-0">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/40 via-background to-background py-10 sm:py-14">
        <div className="relative mx-auto max-w-xl px-4 sm:max-w-2xl">
          <Link
            href="/shop"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to shop
          </Link>

          <div className="mb-8 overflow-hidden rounded-3xl border-2 border-accent/35 bg-gradient-to-br from-accent/15 via-card to-card shadow-lg shadow-accent/10">
            <div className="border-b border-accent/20 bg-accent/10 px-6 py-5">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/30 text-accent-foreground">
                  <Gift className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground/80">
                    You&apos;re covering this order
                  </p>
                  <h1 className="mt-1 font-[family-name:var(--font-brand)] text-2xl font-medium tracking-tight sm:text-3xl">
                    Pay for {checkout.recipientFirstName}&apos;s order
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Items deliver to {checkout.recipientFirstName} in {checkout.deliveryCity}. Enter
                    your payment details below to complete checkout.
                  </p>
                </div>
              </div>
            </div>
            {checkout.senderMessage && (
              <blockquote className="border-b border-border/50 px-6 py-4 text-sm italic text-muted-foreground">
                &ldquo;{checkout.senderMessage}&rdquo;
              </blockquote>
            )}
            <div className="space-y-2 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount to pay
              </p>
              <p className="text-3xl font-semibold tracking-tight text-primary">
                {formatUGX(quote.total)}
              </p>
              <div className="space-y-1.5 pt-2 text-sm">
                <OrderQuoteLines quote={quote} />
              </div>
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <h2 className="font-medium">Order summary</h2>
              </div>
            </div>
            <ul className="divide-y divide-border/50">
              {checkout.items.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex gap-3 px-5 py-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {isRemoteProductImage(item.image) ? (
                      <Image
                        src={item.image!}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatUGX(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <form id="gift-pay-form" onSubmit={handlePay} className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-medium tracking-tight">Your payment details</h2>
                    <p className="text-sm text-muted-foreground">
                      Choose how you want to pay, then enter your details.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {giftMethods.length === 0 ? (
                    <p className="text-sm text-muted-foreground sm:col-span-2">
                      Online payment is temporarily unavailable. Ask the sender to use a different
                      method.
                    </p>
                  ) : (
                    (
                      [
                        {
                          id: 'mobile_money' as const,
                          label: 'Mobile money',
                          hint: 'MTN or Airtel',
                          icon: Smartphone,
                        },
                        {
                          id: 'card' as const,
                          label: 'Card',
                          hint: 'Visa or Mastercard',
                          icon: CreditCard,
                        },
                      ] as const
                    )
                      .filter((option) => giftMethods.includes(option.id))
                      .map((option) => {
                    const selected = payMethod === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPayMethod(option.id)}
                        className={
                          selected
                            ? 'flex items-start gap-3 rounded-2xl border-2 border-primary bg-primary/[0.06] p-4 text-left'
                            : 'flex items-start gap-3 rounded-2xl border-2 border-border/70 bg-background p-4 text-left hover:border-primary/35'
                        }
                      >
                        <option.icon className="mt-0.5 h-5 w-5 text-primary" />
                        <span>
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.hint}</span>
                        </span>
                      </button>
                    );
                      })
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className={fieldClass}
                    autoComplete="name"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="07XX XXX XXX"
                      className={fieldClass}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className={fieldClass}
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden sm:block">
              <Button
                type="submit"
                className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
                disabled={paying || giftMethods.length === 0}
                size="lg"
              >
                {paying && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Pay {formatUGX(quote.total)}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 py-4 backdrop-blur-md sm:hidden">
        <Button
          type="submit"
          form="gift-pay-form"
          className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
          disabled={paying || giftMethods.length === 0}
        >
          {paying && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Pay {formatUGX(quote.total)}
        </Button>
      </div>

      <Footer />
    </main>
  );
}
