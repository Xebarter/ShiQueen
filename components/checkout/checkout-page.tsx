'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  ShoppingBag,
  Smartphone,
  Sparkles,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useProducts } from '@/lib/products-context';
import { useWholesale } from '@/lib/wholesale-context';
import { createOrder, generateOrderId } from '@/lib/firebase/orders';
import { expandPackageCartItems } from '@/lib/package-utils';
import { formatUGX } from '@/lib/wholesale-data';
import type { ShippingAddress } from '@/lib/types/database';
import { cn } from '@/lib/utils';

type PaymentMethod = 'mobile_money' | 'cash_on_delivery';

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof Smartphone;
}[] = [
  {
    id: 'mobile_money',
    label: 'Mobile Money',
    hint: 'MTN or Airtel',
    icon: Smartphone,
  },
  {
    id: 'cash_on_delivery',
    label: 'Cash on delivery',
    hint: 'Pay when it arrives',
    icon: CreditCard,
  },
];

const fieldClass =
  'h-12 rounded-xl border-border/80 bg-background px-4 text-base shadow-sm transition-all placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/10 md:text-base';

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof User;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm shadow-primary/5">
      <div className="border-b border-border/50 bg-gradient-to-r from-primary/[0.06] to-transparent px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-medium tracking-tight text-foreground">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FormField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  className,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className={fieldClass}
      />
    </div>
  );
}

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
      <section className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-secondary/40 to-background py-16">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-light tracking-tight">Your cart is empty</h1>
          <p className="mt-3 text-base text-muted-foreground">
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
  const { products } = useProducts();
  const { packages } = useWholesale();
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

  const orderTotal = total;

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
    const orderItems = expandPackageCartItems(items, packages, products);

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
              tax: 0,
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
            tax: 0,
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
        tax: 0,
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
    <main className="pb-28 md:pb-0">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/40 via-background to-background py-10 sm:py-14">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/8 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-accent/15 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-xl px-4 sm:max-w-2xl">
          <div className="mb-10">
            <Link
              href="/cart"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to cart
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">
                  Secure checkout
                </p>
                <h1 className="mt-2 text-3xl font-light tracking-tight text-foreground sm:text-4xl">
                  Complete your order
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in your bag
                </p>
              </div>

              <div className="rounded-2xl border border-primary/15 bg-card px-5 py-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Order total</p>
                <p className="text-2xl font-semibold tracking-tight text-primary">
                  {formatUGX(orderTotal)}
                </p>
              </div>
            </div>
          </div>

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            <SectionCard
              icon={User}
              title="Your details"
              subtitle="We only ask for what we need to deliver your order."
            >
              <div className="space-y-5">
                <FormField
                  id="fullName"
                  name="fullName"
                  label="Full name"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Jane Nakato"
                  autoComplete="name"
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    id="phone"
                    name="phone"
                    label="Phone number"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="07XX XXX XXX"
                    autoComplete="tel"
                  />
                  <FormField
                    id="email"
                    name="email"
                    label="Email address"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <FormField
                  id="address"
                  name="address"
                  label="Delivery address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street, building, area"
                  autoComplete="street-address"
                />

                <FormField
                  id="city"
                  name="city"
                  label="City"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Kampala"
                  autoComplete="address-level2"
                  className="sm:max-w-xs"
                />
              </div>
            </SectionCard>

            <SectionCard
              icon={Sparkles}
              title="How would you like to pay?"
              subtitle="Choose the option that works best for you."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {PAYMENT_OPTIONS.map(({ id, label, hint, icon: Icon }) => {
                  const selected = paymentMethod === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={cn(
                        'group relative flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all duration-200',
                        selected
                          ? 'border-primary bg-primary/[0.07] shadow-md shadow-primary/10'
                          : 'border-border/70 bg-background hover:border-primary/30 hover:bg-muted/30'
                      )}
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <span
                          className={cn(
                            'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                            selected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                            selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background'
                          )}
                        >
                          {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                      </div>
                      <p className="mt-4 text-base font-semibold text-foreground">{label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm shadow-primary/5">
              <div className="border-b border-border/50 bg-gradient-to-r from-primary/[0.06] to-transparent px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-medium tracking-tight">Order summary</h2>
                    <p className="text-sm text-muted-foreground">
                      <Link href="/cart" className="font-medium text-primary hover:underline">
                        Edit cart
                      </Link>
                      {' · '}
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 px-6 py-5 text-base">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">{formatUGX(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-medium text-emerald-600">Free</span>
                </div>
              </div>

              <div className="mx-6 mb-6 rounded-2xl bg-primary px-5 py-4 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium opacity-90">Total due</span>
                  <span className="text-2xl font-semibold tracking-tight">
                    {formatUGX(orderTotal)}
                  </span>
                </div>
              </div>

              <div className="hidden px-6 pb-6 sm:block">
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
                  disabled={loading}
                  size="lg"
                >
                  {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {submitLabel}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 py-4 backdrop-blur-md sm:hidden">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="text-lg font-semibold text-primary">{formatUGX(orderTotal)}</span>
        </div>
        <Button
          type="submit"
          form="checkout-form"
          className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
          disabled={loading}
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {submitLabel}
        </Button>
      </div>

      <Footer />
    </main>
  );
}
