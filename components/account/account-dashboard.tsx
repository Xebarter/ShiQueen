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
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <main>
      <Header />
      <section className="min-h-[calc(100vh-8rem)] bg-muted/20 py-12">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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
  description: string;
}) {
  return (
    <div className="mb-6 border-b border-border/60 pb-5">
      <h2 className="text-2xl font-light tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
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
    <Card className="border-dashed bg-background/60">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        <div className="mt-5">{action}</div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card size="sm" className="bg-background/80">
      <CardContent className="py-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-light tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const itemPreview = order.items.slice(0, 3);
  const remainingItems = order.items.length - itemPreview.length;

  return (
    <Card className="overflow-hidden bg-background/90 transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-start gap-4 px-4 py-4 text-left sm:px-5 sm:py-5"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Package className="h-5 w-5 text-primary" />
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
        <div className="border-t border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
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
    </Card>
  );
}

export function AccountDashboard() {
  const { user, profile, logout, loading } = useAuth();
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

  return (
    <main>
      <Header />

      <section className="min-h-screen bg-muted/20 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45" aria-hidden />
            <span className="font-medium text-foreground">My Account</span>
          </nav>

          <div className="mb-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Account
            </p>
            <h1 className="mt-1 text-3xl font-light tracking-tight sm:text-4xl">My Account</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Orders, saved items, and account preferences in one place.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[15rem_1fr] xl:grid-cols-[16rem_1fr]">
            <aside className="space-y-4">
              <Card className="overflow-hidden bg-background/90">
                <CardContent className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <AccountAvatar
                      displayName={profile?.displayName ?? user.displayName}
                      email={user.email}
                      photoURL={user.photoURL}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <nav className="hidden flex-col gap-1 lg:flex">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-background hover:text-foreground"
                >
                  <Home className="h-4 w-4 shrink-0" />
                  Home
                </Link>
                <div className="my-2 h-px bg-border/60" />
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigateSection(id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      activeSection === id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/75 hover:bg-background hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
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
                <Link
                  href="/"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground/75 ring-1 ring-border transition-colors hover:text-primary"
                >
                  <Home className="h-3.5 w-3.5" />
                  Home
                </Link>
                {SECTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigateSection(id)}
                    className={cn(
                      'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      activeSection === id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-foreground/75 ring-1 ring-border'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </aside>

            <div className="min-w-0">
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Overview"
                    description="A snapshot of your SheQueen account activity."
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Orders" value={orders.length} hint="All time" />
                    <StatCard label="Wishlist" value={wishlistIds.length} hint="Saved items" />
                    <StatCard
                      label="Member since"
                      value={memberSince ? formatAccountDate(memberSince) : '—'}
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="bg-background/90">
                      <CardHeader>
                        <CardTitle className="font-medium">Latest order</CardTitle>
                        <CardDescription>
                          {latestOrder
                            ? `Placed on ${formatAccountDate(latestOrder.createdAt)}`
                            : 'You have not placed an order yet.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {latestOrder ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium">
                                  #{formatOrderReference(latestOrder.id)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatUGX(latestOrder.total)}
                                </p>
                              </div>
                              <OrderStatusBadge status={latestOrder.status} />
                            </div>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => navigateSection('orders')}
                            >
                              View all orders
                            </Button>
                          </div>
                        ) : (
                          <Link href="/shop" className={cn(buttonVariants(), 'w-full')}>
                            Start shopping
                          </Link>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-background/90">
                      <CardHeader>
                        <CardTitle className="font-medium">Quick links</CardTitle>
                        <CardDescription>Shortcuts to popular account actions.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {[
                          { label: 'Browse new arrivals', href: '/shop', icon: ShoppingBag },
                          { label: 'SheQueen Rewards', href: '/loyalty', icon: Crown },
                          { label: 'Wholesale program', href: '/wholesale', icon: Truck },
                        ].map(({ label, href, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm transition-colors hover:border-primary/25 hover:bg-secondary/40"
                          >
                            <span className="inline-flex items-center gap-2.5">
                              <Icon className="h-4 w-4 text-primary" />
                              {label}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))}
                      </CardContent>
                    </Card>
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      {wishlistProducts.map((product) => (
                        <Card key={product.id} className="overflow-hidden bg-background/90">
                          <div className="flex gap-4 p-4">
                            <Link
                              href={`/products/${product.id}`}
                              className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary"
                            >
                              {isRemoteProductImage(product.image) ? (
                                <ProductImage
                                  product={product}
                                  className="absolute inset-0"
                                  sizes="80px"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-2xl">
                                  ✨
                                </div>
                              )}
                            </Link>

                            <div className="flex min-w-0 flex-1 flex-col">
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                {product.category}
                              </p>
                              <Link
                                href={`/products/${product.id}`}
                                className="mt-0.5 line-clamp-2 font-medium leading-snug hover:text-primary"
                              >
                                {product.name}
                              </Link>
                              <p className="mt-1 text-sm font-semibold tabular-nums">
                                {formatUGX(product.price)}
                              </p>

                              <div className="mt-auto flex flex-wrap gap-2 pt-3">
                                <Button
                                  size="sm"
                                  className="h-8 gap-1.5"
                                  onClick={() => handleAddToCart(product.id)}
                                >
                                  <ShoppingCart className="h-3.5 w-3.5" />
                                  Add to cart
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5"
                                  onClick={() => handleRemoveWishlist(product.id)}
                                  aria-label={`Remove ${product.name} from wishlist`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
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

                  <Card className="bg-background/90">
                    <CardHeader>
                      <CardTitle className="font-medium">Profile</CardTitle>
                      <CardDescription>Your personal account details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-border/60 px-4 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Display name
                          </p>
                          <p className="mt-1 text-sm font-medium">{displayName}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 px-4 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Email
                          </p>
                          <p className="mt-1 text-sm font-medium">{user.email}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 px-4 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Sign-in method
                          </p>
                          <p className="mt-1 text-sm font-medium">{signInMethod}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 px-4 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Member since
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {memberSince ? formatAccountDate(memberSince) : '—'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/90">
                    <CardHeader>
                      <CardTitle className="font-medium">Security</CardTitle>
                      <CardDescription>
                        {signInMethod === 'Google'
                          ? 'Your account is secured through Google sign-in.'
                          : 'Password and email updates will be available in a future release.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Account access</p>
                          <p className="text-sm text-muted-foreground">
                            Sign out on this device when you are finished shopping.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        disabled={signingOut}
                        className="gap-2 sm:shrink-0"
                      >
                        {signingOut ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                        Sign out
                      </Button>
                    </CardContent>
                  </Card>
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
