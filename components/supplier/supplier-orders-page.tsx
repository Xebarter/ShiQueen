'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import Image from 'next/image';
import { ClipboardList, Loader2, Package, Search } from 'lucide-react';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import {
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
} from '@/components/partner/partner-page';
import { SupplierOrderFulfillDialog } from '@/components/supplier/supplier-order-fulfill-dialog';
import { isRemoteProductImage } from '@/components/product-image';
import { InstallWelcomeCard } from '@/components/pwa/install-welcome-card';
import { useAuth } from '@/lib/auth-context';
import { useProducts } from '@/lib/products-context';
import { useWholesale } from '@/lib/wholesale-context';
import { subscribeOrdersForSupplier } from '@/lib/firebase/orders';
import type { Order } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';
import { getOrderPayState } from '@/lib/payments/order-payment';
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  formatOrderDay,
  formatOrderRef,
  itemsTotal,
  resolveOrderItemImage,
  supplierOrderItems,
} from '@/components/supplier/supplier-order-utils';

type FilterId = 'all' | 'hold' | Order['status'];

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'hold', label: 'Hold' },
  { id: 'pending', label: 'New' },
  { id: 'processing', label: 'Pack' },
  { id: 'shipped', label: 'Out' },
  { id: 'delivered', label: 'Done' },
];

function CoverStack({ srcs }: { srcs: string[] }) {
  const shown = srcs.slice(0, 3);
  if (shown.length === 0) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
        <Package className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        'relative h-16 shrink-0',
        shown.length === 1 ? 'w-16' : shown.length === 2 ? 'w-[4.75rem]' : 'w-[5.5rem]'
      )}
      aria-hidden
    >
      {shown.map((src, index) => (
        <div
          key={`${src}-${index}`}
          className="absolute top-0 h-16 w-16 overflow-hidden rounded-xl bg-muted shadow-sm ring-2 ring-card"
          style={{ left: `${index * 12}px`, zIndex: shown.length - index }}
        >
          {isRemoteProductImage(src) ? (
            <Image src={src} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Package className="h-4 w-4" />
            </span>
          )}
        </div>
      ))}
      {srcs.length > 3 ? (
        <span className="absolute -bottom-1 -right-1 z-20 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
          +{srcs.length - 3}
        </span>
      ) : null}
    </div>
  );
}

export default function SupplierOrdersPage() {
  const { supplierId } = useAuth();
  const { products } = useProducts();
  const { packages } = useWholesale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  useEffect(() => {
    if (!supplierId) return;
    return subscribeOrdersForSupplier(supplierId, (next) => {
      setOrders(next);
      setLoading(false);
    });
  }, [supplierId]);

  const counts = useMemo(() => {
    const hold = orders.filter(
      (order) => !getOrderPayState(order).canFulfill && order.status !== 'cancelled'
    ).length;
    const pack = orders.filter((order) => {
      const pay = getOrderPayState(order);
      return pay.canFulfill && (order.status === 'pending' || order.status === 'processing');
    }).length;
    const shipped = orders.filter((order) => order.status === 'shipped').length;
    return { hold, pack, shipped };
  }, [orders]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => {
      const pay = getOrderPayState(order);
      if (filter === 'hold') {
        if (pay.canFulfill || order.status === 'cancelled') return false;
      } else if (filter !== 'all' && order.status !== filter) {
        return false;
      }
      if (!term) return true;
      const items = supplierId
        ? supplierOrderItems(order, supplierId, productsById, packages)
        : order.items;
      return (
        formatOrderRef(order.id).toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        items.some((item) => item.name.toLowerCase().includes(term))
      );
    });
  }, [orders, filter, query, supplierId, productsById, packages]);

  const selected = useMemo(
    () => orders.find((order) => order.id === selectedId) ?? null,
    [orders, selectedId]
  );

  return (
    <SupplierShell>
      <PartnerPage>
        <PartnerPageHeader title="Orders" />
        <Suspense fallback={null}>
          <InstallWelcomeCard appName="ShiQueen Supplier" />
        </Suspense>

        {orders.length > 0 ? (
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Hold', value: counts.hold, tone: 'text-rose-700' },
              { label: 'Pack', value: counts.pack, tone: 'text-sky-700' },
              { label: 'Out', value: counts.shipped, tone: 'text-violet-700' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/60 bg-card/95 px-3 py-3 text-center shadow-sm"
              >
                <p className={cn('text-2xl font-bold tabular-nums', stat.tone)}>{stat.value}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {orders.length > 0 ? (
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name or product"
                className="h-11 w-full rounded-xl border border-border/70 bg-card pl-10 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {FILTERS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setFilter(entry.id)}
                  className={cn(
                    'h-8 shrink-0 rounded-full px-3 text-xs font-semibold',
                    filter === entry.id
                      ? 'bg-foreground text-background'
                      : 'bg-muted/80 text-muted-foreground'
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <PartnerEmptyState
            icon={ClipboardList}
            title={orders.length === 0 ? 'No orders' : 'None'}
            description={orders.length === 0 ? 'Sales will show here.' : 'Try another filter.'}
          />
        ) : (
          <div className="space-y-2.5">
            {visible.map((order) => {
              const items = supplierId
                ? supplierOrderItems(order, supplierId, productsById, packages)
                : order.items;
              const srcs = items
                .map((item) => resolveOrderItemImage(item, productsById, packages))
                .filter((src): src is string => Boolean(src));
              const pay = getOrderPayState(order);

              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedId(order.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border bg-card/95 p-3 text-left shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md sm:p-4',
                    pay.kind === 'failed' && 'border-rose-300/80 bg-rose-50/70',
                    pay.kind === 'waiting' && !pay.canFulfill && 'border-amber-300/80 bg-amber-50/60',
                    pay.canFulfill && 'border-border/60 hover:border-primary/25'
                  )}
                >
                  <CoverStack srcs={srcs} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold tracking-tight">
                          {order.customerName || 'Customer'}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {formatOrderRef(order.id)} · {formatOrderDay(order.createdAt)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatUGX(itemsTotal(items))}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                          pay.kind === 'paid' && 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
                          pay.kind === 'cod' && 'bg-sky-500/15 text-sky-800 ring-sky-500/25',
                          pay.kind === 'waiting' && 'bg-amber-500/15 text-amber-800 ring-amber-500/25',
                          pay.kind === 'failed' && 'bg-rose-500/15 text-rose-800 ring-rose-500/25'
                        )}
                      >
                        {pay.label}
                      </span>
                      {pay.canFulfill ? (
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                            ORDER_STATUS_TONE[order.status]
                          )}
                        >
                          {ORDER_STATUS_LABEL[order.status]}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-inset ring-border">
                          Hold
                        </span>
                      )}
                      {order.status === 'delivered' ? (
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-inset ring-border">
                          Locked
                        </span>
                      ) : null}
                      {order.giftPayment ? (
                        <span className="inline-flex rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground ring-1 ring-inset ring-accent/30">
                          Gift
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                      {items
                        .slice(0, 2)
                        .map((item) => `${item.quantity}× ${item.name}`)
                        .join(' · ')}
                      {items.length > 2 ? ` +${items.length - 2}` : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {supplierId ? (
          <SupplierOrderFulfillDialog
            order={selected}
            supplierId={supplierId}
            productsById={productsById}
            packages={packages}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </PartnerPage>
    </SupplierShell>
  );
}
