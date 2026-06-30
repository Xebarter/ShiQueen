'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Crown,
  Heart,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  Truck,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button, buttonVariants } from '@/components/ui/button';
import { AccountAvatar } from '@/components/account/account-avatar';
import { isRemoteProductImage, ProductImage } from '@/components/product-image';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { subscribeUserOrders } from '@/lib/firebase/orders';
import { getStoredWishlist, removeFromStoredWishlist } from '@/lib/home-merchandising';
import { useProducts } from '@/lib/products-context';
import { Order } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { getDisplayName } from '@/lib/user-display';
import { ShareProductButton } from '@/components/shared/share-button';
import { cn } from '@/lib/utils';

type AccountSection = 'overview' | 'orders' | 'wishlist' | 'settings';

const SECTIONS: { id: AccountSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ORDER_STATUS: Record<
  Order['status'],
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-700 ring-amber-500/20' },
  processing: { label: 'Processing', className: 'bg-sky-500/10 text-sky-700 ring-sky-500/20' },
  shipped: { label: 'Shipped', className: 'bg-violet-500/10 text-violet-700 ring-violet-500/20' },
  delivered: { label: 'Delivered', className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-700 ring-red-500/20' },
};

function parseSectionHash(hash: string): AccountSection {
  const value = hash.replace('#', '');
  if (value === 'orders' || value === 'wishlist' || value === 'settings') return value;
  return 'overview';
}

function formatAccountDate(date: Date): string {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatOrderReference(orderId: string): string {
  if (orderId.length <= 10) return orderId;
  return orderId.slice(-10).toUpperCase();
}

function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const config = ORDER_STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function AccountLoadingState() {
  return (
    <main className="overflow-x-clip">
      <Header />
      <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gradient-to-b from-muted/30 via-background to-background py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
      <Footer />
    </main>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 border-b border-border/50 pb-5">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Package;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-gradient-to-b from-muted/30 to-background px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-medium tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-6">{action}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm ring-1 ring-border/40 transition hover:border-primary/20 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const itemPreview = order.items.slice(0, 3);
  const remainingItems = order.items.length - itemPreview.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-border/40 transition hover:border-primary/20 hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-start gap-4 px-4 py-4 text-left sm:px-5 sm:py-5"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Package className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium tracking-tight">
                Order #{formatOrderReference(order.id)}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatAccountDate(order.createdAt)} · {order.items.length}{' '}
                {order.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums">{formatUGX(order.total)}</p>
              <div className="mt-1.5 flex justify-end">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          </div>

          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {itemPreview.map((item, index) => (
              <li key={`${item.productId}-${index}`} className="line-clamp-1">
                {item.name} × {item.quantity}
              </li>
            ))}
            {remainingItems > 0 && (
              <li className="text-xs">+ {remainingItems} more</li>
            )}
          </ul>
        </div>

        <ChevronDown
          className={cn(
            'mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-border/50 bg-gradient-to-b from-muted/30 to-muted/10 px-4 py-4 sm:px-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Items
              </p>
              <ul className="mt-2 space-y-2">
                {order.items.map((item, index) => (
                  <li
                    key={`${item.productId}-${index}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="line-clamp-1">
                      {item.name}
                      {item.size ? ` · ${item.size}` : ''}
                      {item.color ? ` · ${item.color}` : ''}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      × {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Delivery
              </p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p className="text-foreground">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.phone}</p>
              </div>

              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatUGX(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">{formatUGX(order.tax)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span className="tabular-nums">{formatUGX(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.02]',
        className
      )}
    >
      <div className="border-b border-border/50 px-5 py-4 sm:px-6">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

export function AccountDashboard() {
  const { user, profile, logout, loading, isAdmin } = useAuth();
  const { products, getProductById, loading: productsLoading } = useProducts();
  const { addItem } = useCart();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<AccountSection>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = getDisplayName(profile?.displayName ?? user?.displayName, user?.email);
  const memberSince = profile?.createdAt ?? (user?.metadata.creationTime ? new Date(user.metadata.creationTime) : null);
  const signInMethod = user?.providerData.some((provider) => provider.providerId === 'google.com')
    ? 'Google'
    : 'Email & password';

  const wishlistProducts = useMemo(
    () =>
      wishlistIds
        .map((id) => getProductById(id))
        .filter((product): product is NonNullable<typeof product> => Boolean(product)),
    [wishlistIds, getProductById, products]
  );

  const navigateSection = useCallback((section: AccountSection) => {
    setActiveSection(section);
    const hash = section === 'overview' ? '' : `#${section}`;
    window.history.replaceState(null, '', `/account${hash}`);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setActiveSection(parseSectionHash(window.location.hash));
    const onHashChange = () => setActiveSection(parseSectionHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setOrdersLoading(false);
      return;
    }

    const unsubscribe = subscribeUserOrders(
      user.uid,
      (userOrders) => {
        setOrders(userOrders);
        setOrdersLoading(false);
      },
      () => setOrdersLoading(false)
    );
    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    const syncWishlist = () => setWishlistIds(getStoredWishlist());
    syncWishlist();
    window.addEventListener('wishlist-updated', syncWishlist);
    window.addEventListener('storage', syncWishlist);
    return () => {
      window.removeEventListener('wishlist-updated', syncWishlist);
      window.removeEventListener('storage', syncWishlist);
    };
  }, []);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Unable to sign out. Please try again.');
      console.error(error);
      setSigningOut(false);
    }
  };

  const handleRemoveWishlist = (productId: string) => {
    setWishlistIds(removeFromStoredWishlist(productId));
    toast.success('Removed from wishlist');
  };

  const handleAddToCart = (productId: string) => {
    const product = getProductById(productId);
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
    toast.success(`${product.name} added to cart`);
  };

  if (loading) {
    return <AccountLoadingState />;
  }

  if (!user) {
    return null;
  }

  const latestOrder = orders[0];

  const quickLinks = [
    { label: 'Browse shop', href: '/shop', icon: ShoppingBag },
    { label: 'Packages', href: '/packages', icon: Crown },
    { label: 'Wholesale', href: '/wholesale', icon: Truck },
    ...(isAdmin ? [{ label: 'Admin dashboard', href: '/admin', icon: Shield }] : []),
  ];

  return (
    <main className="min-h-screen overflow-x-clip bg-gradient-to-b from-muted/25 via-background to-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-background to-accent/10" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] [background-size:3rem_3rem]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45" aria-hidden />
            <span className="font-medium text-foreground">My Account</span>
          </nav>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <AccountAvatar
                displayName={profile?.displayName ?? user.displayName}
                email={user.email}
                photoURL={user.photoURL}
                size="lg"
              />
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  <Sparkles className="h-3 w-3" />
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Welcome back, {displayName.split(' ')[0]}
                </h1>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {memberSince ? (
              <p className="shrink-0 text-xs text-muted-foreground sm:text-right">
                Member since{' '}
                <span className="font-medium text-foreground">
                  {formatAccountDate(memberSince)}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[16rem_1fr] xl:grid-cols-[17rem_1fr]">
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <nav className="hidden flex-col gap-1 rounded-2xl border border-border/60 bg-card p-2 shadow-sm ring-1 ring-black/[0.02] lg:flex">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigateSection(id)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      activeSection === id
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/15'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
                <div className="my-1 h-px bg-border/60" />
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <Home className="h-4 w-4 shrink-0" />
                  Back to shop
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive disabled:opacity-50"
                >
                  {signingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  Sign out
                </button>
              </nav>

              <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigateSection(id)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      activeSection === id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card text-muted-foreground ring-1 ring-border'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </aside>

            <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-black/[0.02] sm:p-7 lg:p-8">
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Overview"
                    description="A snapshot of your SheQueen account activity."
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                      label="Orders"
                      value={orders.length}
                      hint="All time"
                      icon={ShoppingBag}
                    />
                    <StatCard
                      label="Wishlist"
                      value={wishlistIds.length}
                      hint="Saved items"
                      icon={Heart}
                    />
                    <StatCard
                      label="Sign-in"
                      value={signInMethod}
                      hint="Account access"
                      icon={User}
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <PanelCard
                      title="Latest order"
                      description={
                        latestOrder
                          ? `Placed on ${formatAccountDate(latestOrder.createdAt)}`
                          : 'You have not placed an order yet.'
                      }
                    >
                      {latestOrder ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3">
                            <div>
                              <p className="font-semibold tracking-tight">
                                #{formatOrderReference(latestOrder.id)}
                              </p>
                              <p className="text-sm tabular-nums text-muted-foreground">
                                {formatUGX(latestOrder.total)}
                              </p>
                            </div>
                            <OrderStatusBadge status={latestOrder.status} />
                          </div>
                          <Button
                            variant="outline"
                            className="w-full rounded-xl"
                            onClick={() => navigateSection('orders')}
                          >
                            View all orders
                          </Button>
                        </div>
                      ) : (
                        <Link href="/shop" className={cn(buttonVariants(), 'w-full rounded-xl')}>
                          Start shopping
                        </Link>
                      )}
                    </PanelCard>

                    <PanelCard title="Quick links" description="Jump to popular destinations.">
                      <div className="space-y-2">
                        {quickLinks.map(({ label, href, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm transition-colors hover:border-primary/25 hover:bg-primary/5"
                          >
                            <span className="inline-flex items-center gap-2.5 font-medium">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Icon className="h-4 w-4" />
                              </span>
                              {label}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    </PanelCard>
                  </div>
                </div>
              )}

              {activeSection === 'orders' && (
                <div>
                  <SectionHeader
                    title="Order history"
                    description="Track purchases, totals, and delivery details."
                  />

                  {ordersLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                  ) : orders.length === 0 ? (
                    <EmptyState
                      icon={Package}
                      title="No orders yet"
                      description="When you place an order, it will appear here with status updates and delivery details."
                      action={
                        <Link href="/shop" className={buttonVariants()}>
                          Browse the shop
                        </Link>
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'wishlist' && (
                <div>
                  <SectionHeader
                    title="Wishlist"
                    description="Items you have saved for later."
                  />

                  {productsLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                  ) : wishlistProducts.length === 0 ? (
                    <EmptyState
                      icon={Heart}
                      title="Your wishlist is empty"
                      description="Tap the heart on any product while shopping to save it here."
                      action={
                        <Link href="/shop" className={buttonVariants()}>
                          Discover products
                        </Link>
                      }
                    />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {wishlistProducts.map((product) => (
                        <div
                          key={product.id}
                          className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-border/40 transition hover:border-primary/20 hover:shadow-md"
                        >
                          <Link
                            href={`/products/${product.id}`}
                            className="relative block aspect-[4/5] overflow-hidden bg-secondary"
                          >
                            {isRemoteProductImage(product.image) ? (
                              <ProductImage
                                product={product}
                                className="absolute inset-0 transition duration-300 group-hover:scale-105"
                                sizes="(max-width: 640px) 50vw, 240px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-3xl">
                                ✨
                              </div>
                            )}
                          </Link>

                          <div className="p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              {product.category}
                            </p>
                            <Link
                              href={`/products/${product.id}`}
                              className="mt-1 line-clamp-2 font-medium leading-snug tracking-tight hover:text-primary"
                            >
                              {product.name}
                            </Link>
                            <p className="mt-1.5 text-sm font-semibold tabular-nums">
                              {formatUGX(product.price)}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="h-8 flex-1 gap-1.5 rounded-lg sm:flex-none"
                                onClick={() => handleAddToCart(product.id)}
                              >
                                <ShoppingCart className="h-3.5 w-3.5" />
                                Add to cart
                              </Button>
                              <ShareProductButton
                                product={product}
                                size="sm"
                                className="h-8 w-8 rounded-lg p-0"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg px-2.5"
                                onClick={() => handleRemoveWishlist(product.id)}
                                aria-label={`Remove ${product.name} from wishlist`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'settings' && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Account settings"
                    description="Profile details and sign-in information."
                  />

                  <PanelCard title="Profile" description="Your personal account details.">
                    <div className="mb-5 flex items-center gap-4 rounded-xl bg-gradient-to-br from-primary/[0.06] via-muted/30 to-transparent p-4 ring-1 ring-border/50">
                      <AccountAvatar
                        displayName={profile?.displayName ?? user.displayName}
                        email={user.email}
                        photoURL={user.photoURL}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold tracking-tight">{displayName}</p>
                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: 'Display name', value: displayName },
                        { label: 'Email', value: user.email ?? '—' },
                        { label: 'Sign-in method', value: signInMethod },
                        {
                          label: 'Member since',
                          value: memberSince ? formatAccountDate(memberSince) : '—',
                        },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-medium">{value}</p>
                        </div>
                      ))}
                    </div>
                  </PanelCard>

                  <PanelCard
                    title="Security"
                    description={
                      signInMethod === 'Google'
                        ? 'Your account is secured through Google sign-in.'
                        : 'Password and email updates will be available in a future release.'
                    }
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">Account access</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            Sign out on this device when you are finished shopping.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        disabled={signingOut}
                        className="gap-2 rounded-xl sm:shrink-0"
                      >
                        {signingOut ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                        Sign out
                      </Button>
                    </div>
                  </PanelCard>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
