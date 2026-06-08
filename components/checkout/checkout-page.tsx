'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, ShoppingBag, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { createOrder, generateOrderId } from '@/lib/firebase/orders';
import {
  calculateTax,
  calculateTotalWithTax,
  formatUGX,
  WHOLESALE_TAX_RATE,
} from '@/lib/wholesale-data';
import type { ShippingAddress } from '@/lib/types/database';
import { cn } from '@/lib/utils';

type PaymentMethod = 'mobile_money' | 'cash_on_delivery';

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  icon: typeof Smartphone;
}[] = [
  { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
  { id: 'cash_on_delivery', label: 'Cash on delivery', icon: CreditCard },
];

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const space = trimmed.indexOf(' ');
  if (space === -1) return { firstName: trimmed, lastName: '' };
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim(),
  };
}

function buildShippingAddress(form: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}): ShippingAddress {
  const { firstName, lastName } = splitFullName(form.fullName);
  return {
    firstName,
    lastName,
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    city: form.city.trim() || 'Kampala',
    state: '',
    zipCode: '',
    country: 'Uganda',
  };
}

function EmptyCheckout() {
  return (
    <main>
      <Header />
      <section className="min-h-[calc(100vh-8rem)] bg-muted/20 py-16">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-light tracking-tight">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add items before checking out.
          </p>
          <Link href="/shop" className="mt-6 inline-block">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Continue shopping
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}

export function CheckoutPage() {
  const { items, total, clearCart, itemCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: user?.email || '',
    address: '',
    city: 'Kampala',
  });

  if (items.length === 0) {
    return <EmptyCheckout />;
  }

  const tax = calculateTax(total);
  const orderTotal = calculateTotalWithTax(total);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const shippingAddress = buildShippingAddress(form);
    const customerName = form.fullName.trim();
    const isWholesaleOrder = items.some((item) => item.quantity >= 10);
    const isPackageOrder = items.some((item) => item.id.startsWith('pkg-'));
    const orderType = isPackageOrder ? 'package' : isWholesaleOrder ? 'wholesale' : 'retail';
    const orderItems = items.map((item) => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      image: item.image,
    }));

    try {
      if (paymentMethod === 'mobile_money') {
        let response: Response;
        try {
          response = await fetch('/api/payments/paytota/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user?.uid ?? null,
              customerName,
              email: form.email,
              phone: form.phone,
              items: orderItems,
              subtotal: total,
              tax,
              total: orderTotal,
              shippingAddress,
              orderType,
              useStkPush: true,
              allowOfflineFallback: true,
            }),
          });
        } catch {
          throw new Error(
            'Could not reach the payment server. Make sure the dev server is running and try again.'
          );
        }

        let data: {
          error?: string;
          checkoutUrl?: string;
          orderId?: string;
          purchaseId?: string;
          requiresClientOrder?: boolean;
          offlineFallback?: boolean;
          message?: string;
          stk?: { status?: string; details?: { message?: string } };
        };

        try {
          data = await response.json();
        } catch {
          throw new Error('Payment server returned an invalid response. Please try again.');
        }

        if (!response.ok) {
          const paytotaUnreachable = data.error?.includes('Could not reach Paytota');
          throw new Error(
            paytotaUnreachable
              ? `${data.error} You can switch to Cash on Delivery below, or retry in a moment.`
              : (data.error ?? 'Failed to start payment')
          );
        }

        const saveClientOrder = async (orderId: string, extras?: { paytotaPurchaseId?: string }) => {
          await createOrder({
            id: orderId,
            userId: user?.uid ?? null,
            customerName,
            email: form.email,
            items: orderItems,
            subtotal: total,
            tax,
            total: orderTotal,
            shippingAddress,
            status: 'pending',
            orderType,
            paymentMethod: 'mobile_money',
            paymentStatus: 'awaiting_payment',
            paytotaPurchaseId: extras?.paytotaPurchaseId,
            paytotaReference: orderId,
          });
        };

        if (data.offlineFallback && data.orderId) {
          if (data.requiresClientOrder) await saveClientOrder(data.orderId);
          toast.success(
            data.message ??
              'Order saved. We will contact you to complete mobile money payment.'
          );
          clearCart();
          router.push(`/order-confirmation?orderId=${data.orderId}&payment=offline`);
          return;
        }

        if (data.requiresClientOrder && data.orderId) {
          await saveClientOrder(data.orderId, { paytotaPurchaseId: data.purchaseId });
        }

        if (data.stk?.status === 'pending' && data.orderId) {
          toast.success(data.stk.details?.message ?? 'Check your phone to approve the payment.');
          router.push(`/order-confirmation?orderId=${data.orderId}&payment=pending`);
          return;
        }

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }

        if (data.orderId) {
          router.push(`/order-confirmation?orderId=${data.orderId}&payment=pending`);
          return;
        }

        throw new Error('No payment URL returned from Paytota');
      }

      const orderId = generateOrderId();
      await createOrder({
        id: orderId,
        userId: user?.uid ?? null,
        customerName,
        email: form.email,
        items: orderItems,
        subtotal: total,
        tax,
        total: orderTotal,
        shippingAddress,
        status: 'pending',
        orderType,
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'cod_pending',
      });

      toast.success('Order placed successfully!');
      clearCart();
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to process order. Please try again.';
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const submitLabel =
    loading
      ? 'Processing…'
      : paymentMethod === 'mobile_money'
        ? `Pay ${formatUGX(orderTotal)}`
        : `Place order · ${formatUGX(orderTotal)}`;

  return (
    <main className="pb-24 md:pb-0">
      <Header />

      <section className="bg-muted/20 py-8 sm:py-12">
        <div className="mx-auto max-w-lg px-4 sm:max-w-xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-tight sm:text-3xl">Checkout</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatUGX(orderTotal)}
              </p>
            </div>
            <Link
              href="/cart"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-border/70 bg-card p-5 sm:p-6">
              <h2 className="text-sm font-medium text-foreground">Your details</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Only what we need to deliver and contact you.
              </p>

              <div className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs">
                    Full name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Jane Nakato"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="07XX XXX XXX"
                    autoComplete="tel"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs">
                    Delivery address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street, building, area"
                    autoComplete="street-address"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Kampala"
                    autoComplete="address-level2"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-5 sm:p-6">
              <h2 className="text-sm font-medium">Payment</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map(({ id, label, icon: Icon }) => {
                  const selected = paymentMethod === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors',
                        selected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border/70 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-5 sm:p-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatUGX(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-emerald-600">Free</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({Math.round(WHOLESALE_TAX_RATE * 100)}%)</span>
                  <span>{formatUGX(tax)}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatUGX(orderTotal)}</span>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'} ·{' '}
                <Link href="/cart" className="text-primary hover:underline">
                  Edit cart
                </Link>
              </p>

              <Button
                type="submit"
                className="mt-5 hidden w-full sm:inline-flex"
                disabled={loading}
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitLabel}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-4 backdrop-blur sm:hidden">
        <Button type="submit" form="checkout-form" className="w-full" disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>

      <Footer />
    </main>
  );
}
