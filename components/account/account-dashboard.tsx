'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  Heart,
  Loader2,
  Package,
  Scissors,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Truck,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AccountMobileNav } from '@/components/account/account-mobile-nav';
import { AccountSidebar } from '@/components/account/account-sidebar';
import { AccountSettings } from '@/components/account/account-settings';
import { AccountSearchHistory } from '@/components/account/account-search-history';
import {
  getAccountSectionMeta,
  parseAccountSectionHash,
  type AccountSection,
} from '@/components/account/account-nav-items';
import { Button, buttonVariants } from '@/components/ui/button';
import { AccountAvatar } from '@/components/account/account-avatar';
import { isRemoteProductImage, ProductImage } from '@/components/product-image';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useServices } from '@/lib/services-context';
import { subscribeUserOrders } from '@/lib/firebase/orders';
import { getStoredWishlist, removeFromStoredWishlist, getDiscountPercent } from '@/lib/home-merchandising';
import { useProducts } from '@/lib/products-context';
import { Order, Product } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { getDisplayName } from '@/lib/user-display';
import { resolveListingImage } from '@/lib/services-utils';
import { ShareProductButton } from '@/components/shared/share-button';
import { cn } from '@/lib/utils';

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

function OrderItemThumb({
  src,
  alt,
  size = 'md',
}: {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/60',
        dim
      )}
    >
      {isRemoteProductImage(src) ? (
        <Image src={src!} alt={alt} fill sizes="64px" className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Package className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
        </div>
      )}
    </div>
  );
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

function OrderCard({
  order,
  resolveItemImage,
}: {
  order: Order;
  resolveItemImage: (item: Order['items'][number]) => string | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const itemPreview = order.items.slice(0, 3);
  const remainingItems = order.items.length - itemPreview.length;
  const coverImages = order.items
    .map((item) => resolveItemImage(item))
    .filter((src): src is string => Boolean(isRemoteProductImage(src)))
    .slice(0, 3);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-border/40 transition hover:border-primary/20 hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5 sm:py-5"
      >
        <div
          className={cn(
            'relative shrink-0',
            coverImages.length > 1 ? 'h-14 w-[4.25rem]' : 'h-14 w-14'
          )}
          aria-hidden
        >
          {coverImages.length > 0 ? (
            coverImages.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="absolute top-0 h-14 w-14 overflow-hidden rounded-xl bg-muted shadow-sm ring-2 ring-card"
                style={{ left: `${index * 14}px`, zIndex: coverImages.length - index }}
              >
                <Image src={src} alt="" fill sizes="56px" className="object-cover" />
              </div>
            ))
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Package className="h-5 w-5" />
            </div>
          )}
          {order.items.length > coverImages.length && coverImages.length > 0 ? (
            <span className="absolute -bottom-1 -right-1 z-20 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
              +{order.items.length - coverImages.length}
            </span>
          ) : null}
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

          <ul className="mt-3 space-y-2">
            {itemPreview.map((item, index) => (
              <li
                key={`${item.productId}-${index}`}
                className="flex items-center gap-2.5 text-sm text-muted-foreground"
              >
                <OrderItemThumb src={resolveItemImage(item)} alt={item.name} size="sm" />
                <span className="min-w-0 flex-1 line-clamp-1 text-foreground/80">
                  {item.name}{' '}
                  <span className="text-muted-foreground">× {item.quantity}</span>
                </span>
              </li>
            ))}
            {remainingItems > 0 && (
              <li className="pl-[2.375rem] text-xs text-muted-foreground">
                + {remainingItems} more
              </li>
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
              <ul className="mt-3 space-y-2.5">
                {order.items.map((item, index) => {
                  const image = resolveItemImage(item);
                  return (
                    <li
                      key={`${item.productId}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/70 p-2 pr-3"
                    >
                      <OrderItemThumb src={image} alt={item.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[item.size, item.color].filter(Boolean).join(' · ') ||
                            (item.itemType === 'service' ? 'Service' : 'Product')}
                          {' · '}
                          <span className="tabular-nums">× {item.quantity}</span>
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatUGX(item.price * item.quantity)}
                      </p>
                    </li>
                  );
                })}
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

function WishlistCard({
  product,
  onAddToCart,
  onRemove,
}: {
  product: Product;
  onAddToCart: (productId: string) => void;
  onRemove: (productId: string) => void;
}) {
  const discount = getDiscountPercent(product);
  const outOfStock = product.stock <= 0;
  const showOriginal =
    Boolean(product.originalPrice) &&
    (product.originalPrice as number) > product.price;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.02] transition duration-300 hover:border-primary/20 hover:shadow-md">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted/40">
        <Link href={`/products/${product.id}`} className="absolute inset-0 block">
          {isRemoteProductImage(product.image) ? (
            <ProductImage
              product={product}
              className="absolute inset-0 transition duration-500 ease-out group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 280px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Heart className="h-8 w-8 opacity-30" />
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent opacity-80" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {discount > 0 && (
            <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground shadow-sm">
              −{discount}%
            </span>
          )}
          {outOfStock && (
            <span className="rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shadow-sm ring-1 ring-border/60">
              Out of stock
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(product.id)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-primary shadow-sm ring-1 ring-border/50 backdrop-blur-sm transition hover:bg-background hover:text-destructive"
          aria-label={`Remove ${product.name} from wishlist`}
        >
          <Heart className="h-4 w-4 fill-current" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {product.category}
        </p>
        <Link
          href={`/products/${product.id}`}
          className="mt-1.5 line-clamp-2 text-[15px] font-medium leading-snug tracking-tight transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
          <p className="text-base font-semibold tabular-nums text-accent">
            {formatUGX(product.price)}
          </p>
          {showOriginal && (
            <p className="text-sm tabular-nums text-muted-foreground line-through">
              {formatUGX(product.originalPrice as number)}
            </p>
          )}
        </div>

        <div className="mt-auto flex gap-2 pt-4">
          <Button
            size="sm"
            className="h-9 flex-1 gap-1.5 rounded-xl"
            disabled={outOfStock}
            onClick={() => onAddToCart(product.id)}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {outOfStock ? 'Unavailable' : 'Add to cart'}
          </Button>
          <ShareProductButton
            product={product}
            size="sm"
            className="h-9 w-9 shrink-0 rounded-xl p-0"
          />
        </div>
      </div>
    </article>
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
  const { user, profile, logout, loading, isAdmin, isSupplier, isServiceProvider, refreshProfile } = useAuth();
  const { products, getProductById, loading: productsLoading } = useProducts();
  const { activeListings } = useServices();
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

  const wishlistTotal = useMemo(
    () => wishlistProducts.reduce((sum, product) => sum + product.price, 0),
    [wishlistProducts]
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
    setActiveSection(parseAccountSectionHash(window.location.hash));
    const onHashChange = () =>
      setActiveSection(parseAccountSectionHash(window.location.hash));
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
  const sectionMeta = getAccountSectionMeta(activeSection);
  const memberSinceLabel = memberSince ? formatAccountDate(memberSince) : null;

  const quickLinks = [
    { label: 'Browse shop', href: '/shop', icon: ShoppingBag },
    { label: 'Packages', href: '/packages', icon: Crown },
    { label: 'Wholesale', href: '/wholesale', icon: Truck },
    { label: 'Search history', href: '/account#search', icon: Clock },
    ...(isAdmin ? [{ label: 'Admin dashboard', href: '/admin', icon: Shield }] : []),
    ...(isSupplier ? [{ label: 'Supplier dashboard', href: '/suppliers/orders', icon: Truck }] : []),
    ...(isServiceProvider
      ? [{ label: 'Services dashboard', href: '/services/dashboard/bookings', icon: Scissors }]
      : []),
  ];

  return (
    <main className="min-h-screen overflow-x-clip bg-gradient-to-b from-muted/25 via-background to-background">
      <Header />

      <section className="py-6 sm:py-8 lg:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 hidden flex-wrap items-center gap-2 text-sm lg:flex"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45" aria-hidden />
            <span className="text-muted-foreground">My Account</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45" aria-hidden />
            <span className="font-medium text-foreground">{sectionMeta.label}</span>
          </nav>

          <AccountMobileNav
            activeSection={activeSection}
            onNavigate={navigateSection}
            displayName={displayName}
            email={user.email}
            signingOut={signingOut}
            onLogout={handleLogout}
          />

          <div className="grid gap-8 lg:grid-cols-[17rem_1fr] xl:grid-cols-[18rem_1fr]">
            <AccountSidebar
              className="hidden lg:flex"
              activeSection={activeSection}
              onNavigate={navigateSection}
              displayName={displayName}
              email={user.email}
              memberSinceLabel={memberSinceLabel}
              signingOut={signingOut}
              onLogout={handleLogout}
            />

            <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-black/[0.02] sm:p-7 lg:p-8">
              <p className="mb-5 text-sm text-muted-foreground lg:hidden">
                {sectionMeta.description}
              </p>
              <div className="mb-6 hidden border-b border-border/50 pb-5 lg:block">
                <h1 className="text-2xl font-semibold tracking-tight">{sectionMeta.label}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{sectionMeta.description}</p>
              </div>
              {activeSection === 'overview' && (
                <div className="space-y-6">
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
                        <OrderCard
                          key={order.id}
                          order={order}
                          resolveItemImage={(item) => {
                            if (isRemoteProductImage(item.image)) return item.image;
                            if (item.itemType === 'service' || item.serviceId) {
                              const listing = activeListings.find(
                                (s) => s.id === (item.serviceId || item.productId)
                              );
                              return listing ? resolveListingImage(listing) ?? undefined : undefined;
                            }
                            const product = getProductById(item.productId);
                            if (!product) return undefined;
                            if (isRemoteProductImage(product.image)) return product.image;
                            return product.images.find((url) => isRemoteProductImage(url));
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'wishlist' && (
                <div className="space-y-6">
                  {productsLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                  ) : wishlistProducts.length === 0 ? (
                    <EmptyState
                      icon={Heart}
                      title="Nothing saved yet"
                      description="Save pieces you love while browsing — they will wait here until you are ready."
                      action={
                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                          <Link href="/shop" className={buttonVariants()}>
                            Browse the shop
                          </Link>
                          <Link
                            href="/packages"
                            className={buttonVariants({ variant: 'outline' })}
                          >
                            Explore packages
                          </Link>
                        </div>
                      }
                    />
                  ) : (
                    <>
                      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.05] via-muted/20 to-transparent px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                            Saved for later
                          </p>
                          <p className="mt-1 text-lg font-semibold tracking-tight">
                            {wishlistProducts.length}{' '}
                            {wishlistProducts.length === 1 ? 'piece' : 'pieces'}
                            <span className="mx-2 text-muted-foreground/40">·</span>
                            <span className="tabular-nums text-accent">
                              {formatUGX(wishlistTotal)}
                            </span>
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            Estimated value of your wishlist
                          </p>
                        </div>
                        <Link
                          href="/shop"
                          className={cn(
                            buttonVariants({ variant: 'outline' }),
                            'shrink-0 rounded-xl'
                          )}
                        >
                          Continue shopping
                        </Link>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {wishlistProducts.map((product) => (
                          <WishlistCard
                            key={product.id}
                            product={product}
                            onAddToCart={handleAddToCart}
                            onRemove={handleRemoveWishlist}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeSection === 'search' && <AccountSearchHistory />}

              {activeSection === 'settings' && user && (
                <AccountSettings
                  user={user}
                  profile={profile}
                  isAdmin={isAdmin}
                  onLogout={handleLogout}
                  signingOut={signingOut}
                  onProfileUpdated={refreshProfile}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
