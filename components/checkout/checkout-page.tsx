'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isRemoteProductImage } from '@/components/product-image';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { createOrder, generateOrderId } from '@/lib/firebase/orders';
import {
  calculateTax,
  calculateTotalWithTax,
  formatUGX,
  WHOLESALE_TAX_RATE,
} from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

type PaymentMethod = 'mobile_money' | 'cash_on_delivery';

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof Smartphone;
}[] = [
  {
    id: 'mobile_money',
    label: 'Mobile Money',
    description: 'MTN or Airtel — pay after order confirmation',
    icon: Smartphone,
  },
  {
    id: 'cash_on_delivery',
    label: 'Cash on Delivery',
    description: 'Pay when your order arrives in Kampala',
    icon: CreditCard,
  },
];

const CHECKOUT_STEPS = [
  { id: 'cart', label: 'Cart', href: '/cart', complete: true },
  { id: 'checkout', label: 'Checkout', href: '/checkout', complete: false, active: true },
  { id: 'confirmation', label: 'Confirmation', href: '#', complete: false },
] as const;

function CheckoutBreadcrumb() {
  return (
    <nav aria-label="Checkout progress" className="mb-8 flex flex-wrap items-center gap-2 text-sm">
      <Link href="/" className="text-muted-foreground transition hover:text-foreground">
        Home
      </Link>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60" aria-hidden />
      <Link href="/cart" className="text-muted-foreground transition hover:text-foreground">
        Cart
      </Link>
      <ChevronRight className="h-4 w-4 text-muted-foreground/60" aria-hidden />
      <span className="font-medium text-foreground">Checkout</span>
    </nav>
  );
}

function CheckoutSteps() {
  return (
    <ol className="mb-10 flex items-center gap-2 sm:gap-4">
      {CHECKOUT_STEPS.map((step, index) => {
        const isLast = index === CHECKOUT_STEPS.length - 1;
        const isActive = 'active' in step && step.active;
        const isComplete = step.complete;

        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset transition-colors',
                  isComplete && 'bg-primary text-primary-foreground ring-primary/30',
                  isActive && 'bg-primary/10 text-primary ring-primary/25',
                  !isComplete && !isActive && 'bg-muted text-muted-foreground ring-border'
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  'hidden truncate text-sm sm:inline',
                  isActive || isComplete ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && <div className="h-px flex-1 bg-border/80" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function EmptyCheckout() {
  return (
    <main>
      <Header />
      <section className="min-h-[calc(100vh-8rem)] bg-muted/20 py-16">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-light tracking-tight">Your cart is empty</h1>
          <p className="mt-3 text-muted-foreground">
            Add items to your cart before proceeding to checkout.
          </p>
          <Link href="/shop" className="mt-8 inline-block">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function SummaryLineItem({
  name,
  quantity,
  price,
  image,
  size,
  color,
}: {
  name: string;
  quantity: number;
  price: number;
  image: string;
  size?: string;
  color?: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/60">
        {isRemoteProductImage(image) ? (
          <Image src={image} alt={name} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg">🛍️</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{name}</p>
        {(size || color) && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[size && `Size ${size}`, color && `Color ${color}`].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">Qty {quantity}</p>
      </div>
      <p className="shrink-0 text-sm font-medium">{formatUGX(price * quantity)}</p>
    </div>
  );
}

export function CheckoutPage() {
  const { items, total, clearCart, itemCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Uganda',
  });

  if (items.length === 0) {
    return <EmptyCheckout />;
  }

  const tax = calculateTax(total);
  const orderTotal = calculateTotalWithTax(total);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderId = generateOrderId();
      const isWholesaleOrder = items.some((item) => item.quantity >= 10);
      const isPackageOrder = items.some((item) => item.id.startsWith('pkg-'));

      await createOrder({
        id: orderId,
        userId: user?.uid ?? null,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: item.image,
        })),
        subtotal: total,
        tax,
        total: orderTotal,
        shippingAddress: formData,
        status: 'pending',
        orderType: isPackageOrder ? 'package' : isWholesaleOrder ? 'wholesale' : 'retail',
      });

      toast.success('Order placed successfully!');
      clearCart();
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch (error) {
      toast.error('Failed to process order. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Header />

      <section className="bg-muted/20 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <CheckoutBreadcrumb />

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-tight sm:text-4xl">Checkout</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} · Secure checkout
              </p>
            </div>
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to cart
            </Link>
          </div>

          <CheckoutSteps />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="text-lg font-light tracking-tight">Contact</CardTitle>
                  <CardDescription>We&apos;ll send order updates to this email and phone.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Jane"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Nakato"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+256 7XX XXX XXX"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg font-light tracking-tight">Delivery address</CardTitle>
                  </div>
                  <CardDescription>Where should we deliver your order?</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Plot, street, building"
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">City / Town</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Kampala"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">District</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="Central Region"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">
                          Area code <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          placeholder="00256"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="text-lg font-light tracking-tight">Payment method</CardTitle>
                  <CardDescription>Choose how you&apos;d like to pay for this order.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PAYMENT_OPTIONS.map(({ id, label, description, icon: Icon }) => {
                      const selected = paymentMethod === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setPaymentMethod(id)}
                          className={cn(
                            'rounded-xl border p-4 text-left transition-all',
                            selected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border/70 bg-background hover:border-primary/30'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <span
                              className={cn(
                                'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border',
                                selected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border bg-background'
                              )}
                            >
                              {selected && <Check className="h-3 w-3" />}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-medium">{label}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    Card payments via Stripe will be available soon. For now, our team will confirm payment
                    details after you place your order.
                  </p>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full sm:hidden" disabled={loading} size="lg">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Processing…' : `Place order · ${formatUGX(orderTotal)}`}
              </Button>
            </form>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card className="overflow-hidden">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-light tracking-tight">Order summary</CardTitle>
                      <CardDescription>{itemCount} {itemCount === 1 ? 'item' : 'items'}</CardDescription>
                    </div>
                    <Link
                      href="/cart"
                      className="text-xs font-medium text-primary transition hover:text-primary/80"
                    >
                      Edit cart
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="pt-5">
                  <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <SummaryLineItem
                        key={`${item.id}-${item.size ?? ''}-${item.color ?? ''}`}
                        name={item.name}
                        quantity={item.quantity}
                        price={item.price}
                        image={item.image}
                        size={item.size}
                        color={item.color}
                      />
                    ))}
                  </div>

                  <div className="mt-6 space-y-3 border-t border-border/60 pt-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatUGX(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium text-emerald-600">Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({Math.round(WHOLESALE_TAX_RATE * 100)}%)</span>
                      <span>{formatUGX(tax)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
                    <span className="text-base font-semibold">Total</span>
                    <span className="text-xl font-semibold tracking-tight">{formatUGX(orderTotal)}</span>
                  </div>

                  <Button
                    type="submit"
                    form="checkout-form"
                    className="mt-6 hidden w-full sm:inline-flex"
                    disabled={loading}
                    size="lg"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Processing…' : 'Place order'}
                  </Button>

                  <div className="mt-6 grid gap-2.5 rounded-xl bg-muted/40 p-4">
                    {[
                      { icon: ShieldCheck, text: 'Secure checkout' },
                      { icon: Truck, text: 'Free delivery on all orders' },
                      { icon: Package, text: 'Carefully packed for you' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <Icon className="h-4 w-4 shrink-0 text-primary/80" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
