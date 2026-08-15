'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Truck,
  User,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isRemoteProductImage } from '@/components/product-image';
import { useCart, type CartItem } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useProducts } from '@/lib/products-context';
import { useWholesale } from '@/lib/wholesale-context';
import { useServices } from '@/lib/services-context';
import { createOrder, generateOrderId } from '@/lib/firebase/orders';
import { expandPackageCartItems, isPackageCartItem } from '@/lib/package-utils';
import { SendPaymentLinkCard } from '@/components/checkout/send-payment-link-card';
import { GiftPayChoice, type GiftPayMode } from '@/components/payments/gift-pay-choice';
import { getWholesaleSavings } from '@/lib/wholesale-cart';
import { formatUGX } from '@/lib/wholesale-data';
import type { PaymentMethod, ShippingAddress } from '@/lib/types/database';
import { PAYMENT_METHOD_LABELS } from '@/lib/payments/labels';
import { cn } from '@/lib/utils';

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof Smartphone;
}[] = [
  {
    id: 'mobile_money',
    label: PAYMENT_METHOD_LABELS.mobile_money,
    hint: 'MTN or Airtel · STK push',
    icon: Smartphone,
  },
  {
    id: 'card',
    label: PAYMENT_METHOD_LABELS.card,
    hint: 'Visa, Mastercard · secure checkout',
    icon: CreditCard,
  },
  {
    id: 'cash_on_delivery',
    label: PAYMENT_METHOD_LABELS.cash_on_delivery,
    hint: 'Pay when your order arrives',
    icon: Wallet,
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'Secure checkout' },
  { icon: Truck, label: 'Free delivery' },
  { icon: Lock, label: 'Data protected' },
] as const;

const fieldClass =
  'h-12 rounded-xl border-border/80 bg-background px-4 text-base shadow-sm transition-all placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/10 md:text-base';

function SectionCard({
  step,
  icon: Icon,
  title,
  subtitle,
  children,
  className,
}: {
  step?: number;
  icon: typeof User;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm shadow-primary/5 transition-shadow hover:shadow-md hover:shadow-primary/8',
        className
      )}
    >
      <div className="border-b border-border/50 bg-gradient-to-r from-primary/[0.07] via-primary/[0.03] to-transparent px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3.5">
          {step !== undefined && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25">
              {step}
            </span>
          )}
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
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

function CheckoutProgress() {
  const steps = [
    { label: 'Delivery', icon: MapPin, active: true },
    { label: 'Payment', icon: CreditCard, active: true },
    { label: 'Confirm', icon: Check, active: false },
  ];

  return (
    <ol className="mb-8 flex items-center justify-between gap-2 sm:mb-10 sm:justify-start sm:gap-0">
      {steps.map((step, index) => (
        <li key={step.label} className="flex flex-1 items-center sm:flex-none">
          <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-3">
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors sm:h-10 sm:w-10',
                step.active
                  ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'border-border bg-muted/50 text-muted-foreground'
              )}
            >
              <step.icon className="h-4 w-4" />
            </span>
            <span
              className={cn(
                'text-[10px] font-semibold uppercase tracking-wider sm:text-xs',
                step.active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'mx-1 hidden h-0.5 flex-1 rounded-full sm:mx-4 sm:block sm:w-16 lg:w-24',
                index === 0 ? 'bg-primary/40' : 'bg-border'
              )}
              aria-hidden
            />
          )}
        </li>
      ))}
    </ol>
  );
}

function CheckoutItemRow({ item }: { item: CartItem }) {
  const lineTotal = item.price * item.quantity;
  const isPackage = isPackageCartItem(item);

  return (
    <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <div className="relative h-14 w-14 shrink-0">
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/60">
          {isRemoteProductImage(item.image) ? (
            <Image
              src={item.image!}
              alt={item.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-lg">✨</div>
          )}
        </div>
        <span className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-sm">
          {item.quantity}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {isPackage && (
            <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              Package
            </span>
          )}
          {item.wholesale && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              Wholesale
            </span>
          )}
          {(item.size || item.color) && (
            <span className="text-xs text-muted-foreground">
              {[item.size, item.color].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
        {formatUGX(lineTotal)}
      </p>
    </li>
  );
}

function OrderSummaryPanel({
  items,
  total,
  orderTotal,
  itemCount,
  wholesaleSavings,
  loading,
  submitLabel,
  paymentMethod,
  payMode,
}: {
  items: CartItem[];
  total: number;
  orderTotal: number;
  itemCount: number;
  wholesaleSavings: number;
  loading: boolean;
  submitLabel: string;
  paymentMethod: PaymentMethod;
  payMode: GiftPayMode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg shadow-primary/5 ring-1 ring-primary/5">
      <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.08] via-card to-accent/[0.06] px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Your order</h2>
              <p className="text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <Link
            href="/cart"
            className="text-sm font-medium text-primary transition hover:underline"
          >
            Edit
          </Link>
        </div>
      </div>

      <ul className="max-h-64 divide-y divide-border/50 overflow-y-auto px-5 py-1.5 sm:px-6">
        {items.map((item) => (
          <CheckoutItemRow
            key={[item.id, item.size, item.color, item.wholesale ? 'w' : 'r'].filter(Boolean).join('-')}
            item={item}
          />
        ))}
      </ul>

      <div className="space-y-2.5 border-t border-border/50 px-5 py-4 text-sm sm:px-6">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-medium text-foreground">{formatUGX(total)}</span>
        </div>
        {wholesaleSavings > 0 && (
          <div className="flex justify-between text-accent">
            <span>Wholesale savings</span>
            <span className="font-medium">−{formatUGX(wholesaleSavings)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery</span>
          <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
            <Truck className="h-3.5 w-3.5" />
            Free
          </span>
        </div>
      </div>

      <div className="mx-5 mb-4 rounded-2xl bg-gradient-to-r from-primary to-primary/90 px-5 py-4 text-primary-foreground shadow-inner sm:mx-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium opacity-90">Total due</p>
            <p className="text-xs opacity-75">
              {payMode === 'gift'
                ? 'Someone else will pay'
                : PAYMENT_METHOD_LABELS[paymentMethod]}
            </p>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums">{formatUGX(orderTotal)}</p>
        </div>
      </div>

      <div className="hidden px-5 pb-5 sm:block sm:px-6 sm:pb-6">
        {payMode === 'gift' ? (
          <p className="rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-center text-sm text-muted-foreground">
            Use <span className="font-medium text-foreground">Share payment link</span> above —
            no need to place the order yourself.
          </p>
        ) : (
          <>
            <Button
              type="submit"
              form="checkout-form"
              className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/25 transition hover:shadow-xl hover:shadow-primary/30"
              disabled={loading}
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {submitLabel}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Encrypted & secure payment
            </p>
          </>
        )}
      </div>
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
    <main className="min-h-screen bg-background">
      <Header />
      <section className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-md px-4 text-center">
          <span className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <ShoppingBag className="h-9 w-9" />
          </span>
          <h1 className="text-3xl font-light tracking-tight sm:text-4xl">Your cart is empty</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Add something beautiful from our shop, then return here to checkout.
          </p>
          <Link href="/shop" className="mt-8 inline-block">
            <Button className="h-12 gap-2 rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/20">
              <ArrowLeft className="h-4 w-4" />
              Browse the shop
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
  const { activeListings } = useServices();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [payMode, setPayMode] = useState<GiftPayMode>('self');
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
  const orderItems = expandPackageCartItems(items, packages, products, activeListings);
  const wholesaleSavings = getWholesaleSavings(items);
  const isWholesaleOrder = items.some((item) => item.quantity >= 10);
  const isPackageOrder = items.some((item) => item.id.startsWith('pkg-'));
  const orderType = isPackageOrder ? 'package' : isWholesaleOrder ? 'wholesale' : 'retail';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payMode === 'gift') {
      toast.error('Share a payment link below, or switch to “I’ll pay”.');
      return;
    }
    setLoading(true);

    const shippingAddress = buildShippingAddress(form);
    const customerName = form.fullName.trim();
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

      if (paymentMethod === 'card') {
        let response: Response;
        try {
          response = await fetch('/api/payments/card/initiate', {
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
          transToken?: string;
          transRef?: string;
          requiresClientOrder?: boolean;
        };

        try {
          data = await response.json();
        } catch {
          throw new Error('Payment server returned an invalid response. Please try again.');
        }

        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to start card payment');
        }

        if (data.requiresClientOrder && data.orderId) {
          await createOrder({
            id: data.orderId,
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
            paymentMethod: 'card',
            paymentStatus: 'awaiting_payment',
            cardTransToken: data.transToken,
            cardTransRef: data.transRef,
          });
        }

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }

        throw new Error('No card checkout URL was returned. Please try again.');
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
      ? paymentMethod === 'card'
        ? 'Opening secure checkout…'
        : 'Processing…'
      : paymentMethod === 'cash_on_delivery'
        ? `Place order · ${formatUGX(orderTotal)}`
        : paymentMethod === 'card'
          ? `Pay ${formatUGX(orderTotal)} by card`
          : `Pay ${formatUGX(orderTotal)}`;

  return (
    <main className="min-h-screen bg-background pb-32 md:pb-0">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-secondary/60 via-background to-background">
        <div
          className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <Link
            href="/cart"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to cart
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">
                ShiQueen checkout
              </p>
              <h1 className="mt-2 text-3xl font-light tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem]">
                Complete your order
              </h1>
              <p className="mt-2 max-w-lg text-base leading-relaxed text-muted-foreground">
                You&apos;re almost there — confirm delivery details and choose how you&apos;d like
                to pay.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 xl:gap-12">
          <div>
            <CheckoutProgress />

            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              <SectionCard
                step={1}
                icon={User}
                title="Delivery details"
                subtitle="Where should we send your order? We'll only use this for delivery updates."
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
                    label="Street address"
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

                  <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm text-foreground/90">
                      <span className="font-medium text-emerald-700">Free delivery</span>
                      {' · '}
                      Standard delivery across Kampala &amp; surrounding areas.
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                step={2}
                icon={Sparkles}
                title="Who is paying?"
                subtitle="Pay yourself, or send a secure link so someone else can cover this order."
              >
                <GiftPayChoice mode={payMode} onChange={setPayMode} />

                {payMode === 'gift' ? (
                  <div className="mt-5">
                    <SendPaymentLinkCard
                      cartItems={items}
                      orderItems={orderItems}
                      subtotal={total}
                      total={orderTotal}
                      orderType={orderType}
                      deliveryDetails={{
                        fullName: form.fullName,
                        email: form.email,
                        phone: form.phone,
                        address: form.address,
                        city: form.city,
                      }}
                      senderUserId={user?.uid ?? null}
                    />
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
                              ? 'border-primary bg-gradient-to-br from-primary/[0.09] to-primary/[0.03] shadow-lg shadow-primary/15 ring-1 ring-primary/20'
                              : 'border-border/70 bg-background hover:border-primary/35 hover:bg-muted/40 hover:shadow-md'
                          )}
                        >
                          <div className="flex w-full items-start justify-between gap-3">
                            <span
                              className={cn(
                                'flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200',
                                selected
                                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
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
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{hint}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </SectionCard>

              {/* Mobile-only compact order preview */}
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm lg:hidden">
                <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                  <span className="text-sm font-medium">Order preview</span>
                  <Link href="/cart" className="text-xs font-medium text-primary">
                    Edit cart
                  </Link>
                </div>
                <ul className="divide-y divide-border/50 px-4">
                  {items.slice(0, 3).map((item) => (
                    <CheckoutItemRow
                      key={[item.id, item.size, item.color].join('-')}
                      item={item}
                    />
                  ))}
                </ul>
                {items.length > 3 && (
                  <p className="px-4 py-2 text-center text-xs text-muted-foreground">
                    +{items.length - 3} more {items.length - 3 === 1 ? 'item' : 'items'}
                  </p>
                )}
              </div>
            </form>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <OrderSummaryPanel
                items={items}
                total={total}
                orderTotal={orderTotal}
                itemCount={itemCount}
                wholesaleSavings={wholesaleSavings}
                loading={loading}
                submitLabel={submitLabel}
                paymentMethod={paymentMethod}
                payMode={payMode}
              />
            </div>
          </aside>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 py-4 backdrop-blur-md lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} ·{' '}
              {payMode === 'gift'
                ? 'Someone else pays'
                : PAYMENT_METHOD_LABELS[paymentMethod]}
            </p>
            <p className="text-xl font-bold tracking-tight text-primary tabular-nums">
              {formatUGX(orderTotal)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <Truck className="h-3 w-3" />
            Free delivery
          </span>
        </div>
        {payMode === 'gift' ? (
          <Button
            type="button"
            className="h-12 w-full gap-2 rounded-xl text-base font-semibold"
            onClick={() => {
              document.getElementById('share-gift-payment-link')?.click();
              document
                .getElementById('share-gift-payment-link')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            Share payment link
          </Button>
        ) : (
          <Button
            type="submit"
            form="checkout-form"
            className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
            disabled={loading}
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {submitLabel}
          </Button>
        )}
      </div>

      <Footer />
    </main>
  );
}
