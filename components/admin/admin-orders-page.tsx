'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  Truck,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { AdminOrderDialog } from '@/components/admin/admin-order-dialog';
import { subscribeOrders, updateOrderStatus } from '@/lib/firebase/orders';
import { Order, type PaymentMethod, type PaymentStatus } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['All', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const ORDER_STATUS: Record<Order['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-800 ring-amber-500/20' },
  processing: { label: 'Processing', className: 'bg-sky-500/10 text-sky-800 ring-sky-500/20' },
  shipped: { label: 'Shipped', className: 'bg-indigo-500/10 text-indigo-800 ring-indigo-500/20' },
  delivered: { label: 'Delivered', className: 'bg-emerald-500/10 text-emerald-800 ring-emerald-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-500/10 text-rose-800 ring-rose-500/20' },
};

/** Alternating light premium fills so neighboring strips never share a color. */
const STRIP_TONES = [
  {
    strip: 'border-amber-200/70 bg-[#FBF6EE] hover:border-amber-300/80 hover:bg-[#F8F0E4]',
    divider: 'border-amber-900/8',
  },
  {
    strip: 'border-sky-200/70 bg-[#F0F7FB] hover:border-sky-300/80 hover:bg-[#E8F3F9]',
    divider: 'border-sky-900/8',
  },
  {
    strip: 'border-emerald-200/70 bg-[#EFF8F3] hover:border-emerald-300/80 hover:bg-[#E6F4EC]',
    divider: 'border-emerald-900/8',
  },
  {
    strip: 'border-rose-200/70 bg-[#FBF1F2] hover:border-rose-300/80 hover:bg-[#F7E8EA]',
    divider: 'border-rose-900/8',
  },
  {
    strip: 'border-slate-200/80 bg-[#F4F6F8] hover:border-slate-300/80 hover:bg-[#EEF1F4]',
    divider: 'border-slate-900/8',
  },
] as const;

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  awaiting_payment: {
    label: 'Awaiting payment',
    className: 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/10 text-red-700 ring-red-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-500/10 text-slate-700 ring-slate-500/20',
  },
  cod_pending: {
    label: 'COD pending',
    className: 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
  },
};

const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  mobile_money: 'Mobile money',
  cash_on_delivery: 'Cash on delivery',
};

function formatOrderReference(orderId: string): string {
  if (orderId.length <= 12) return orderId.toUpperCase();
  return `#${orderId.slice(-8).toUpperCase()}`;
}

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const config = ORDER_STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status?: PaymentStatus }) {
  if (!status) {
    return (
      <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Unknown
      </span>
    );
  }
  const config = PAYMENT_STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function OrderTypeBadge({ type }: { type: Order['orderType'] }) {
  return (
    <span className="inline-flex shrink-0 rounded-md bg-muted/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {type}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof ShoppingBag;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn('mt-1 text-2xl font-bold tabular-nums', accent)}>{value}</p>
        </div>
        <span className={cn('rounded-lg bg-muted p-2', accent)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function StatusSelect({
  order,
  className,
  onUpdate,
}: {
  order: Order;
  className?: string;
  onUpdate: (orderId: string, status: Order['status']) => void;
}) {
  return (
    <select
      value={order.status}
      onChange={(e) => {
        e.stopPropagation();
        onUpdate(order.id, e.target.value as Order['status']);
      }}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Update status for order ${formatOrderReference(order.id)}`}
      className={cn(
        'h-8 rounded-md border border-border/80 bg-background px-2 text-xs capitalize shadow-sm focus:outline-none focus:ring-2 focus:ring-primary',
        className
      )}
    >
      {STATUS_OPTIONS.filter((s) => s !== 'All').map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

function OrderStrip({
  order,
  toneIndex,
  onOpen,
  onUpdateStatus,
}: {
  order: Order;
  toneIndex: number;
  onOpen: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
}) {
  const contact = order.email || order.shippingAddress?.phone || 'No contact';
  const itemPreview = order.items
    .slice(0, 2)
    .map((item) => item.name)
    .join(', ');
  const moreCount = Math.max(0, order.items.length - 2);
  const tone = STRIP_TONES[toneIndex % STRIP_TONES.length];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(order.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(order.id);
        }
      }}
      className={cn(
        'group relative overflow-hidden rounded-xl border text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        'transition-[border-color,box-shadow,background-color] duration-150',
        'hover:shadow-[0_2px_10px_rgba(15,23,42,0.06)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        tone.strip
      )}
    >
      <div className="flex min-w-0 flex-col gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5 lg:flex-row lg:items-center lg:gap-5">
        {/* Identity */}
        <div className="min-w-0 flex-1 lg:max-w-[14rem] xl:max-w-[16rem]">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-mono text-sm font-semibold tracking-tight text-foreground">
              {formatOrderReference(order.id)}
            </p>
            <OrderTypeBadge type={order.orderType} />
          </div>
          <p className="mt-1 truncate text-sm font-medium text-foreground">
            {order.customerName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{contact}</p>
        </div>

        {/* Items preview */}
        <div
          className={cn(
            'min-w-0 flex-1 border-t pt-3 lg:border-t-0 lg:border-l lg:px-5 lg:pt-0',
            tone.divider
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ordered
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm text-foreground/90">
            {itemPreview || 'No items'}
            {moreCount > 0 ? ` +${moreCount} more` : ''}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {order.items.length} line{order.items.length === 1 ? '' : 's'} ·{' '}
            {formatOrderDate(order.createdAt)}
          </p>
        </div>

        {/* Payment + status */}
        <div
          className={cn(
            'flex flex-wrap items-center gap-2 border-t pt-3 lg:w-[13.5rem] lg:shrink-0 lg:flex-col lg:items-start lg:border-t-0 lg:border-l lg:px-5 lg:pt-0',
            tone.divider
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {order.paymentMethod ? PAYMENT_METHOD[order.paymentMethod] : 'Payment n/a'}
          </p>
        </div>

        {/* Total + actions */}
        <div
          className={cn(
            'flex items-end justify-between gap-3 border-t pt-3 lg:w-[11.5rem] lg:shrink-0 lg:flex-col lg:items-end lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0',
            tone.divider
          )}
        >
          <div className="text-left lg:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </p>
            <p className="text-base font-semibold tabular-nums tracking-tight">
              {formatUGX(order.total)}
            </p>
          </div>
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <StatusSelect order={order} onUpdate={onUpdateStatus} />
            <Button
              size="sm"
              variant="outline"
              className="hidden h-8 shrink-0 border-border/70 bg-white/70 backdrop-blur-sm sm:inline-flex"
              onClick={() => onOpen(order.id)}
            >
              Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get('order');
    if (fromQuery) setSelectedOrderId(fromQuery);
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = subscribeOrders(
      (nextOrders) => {
        setOrders(nextOrders);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to load orders');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const closeDialog = () => {
    setSelectedOrderId(null);
    if (searchParams.get('order')) {
      router.replace('/admin/orders');
    }
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return orders.filter((order) => {
      const phone = order.shippingAddress?.phone?.toLowerCase() ?? '';
      const itemHaystack = order.items.map((item) => item.name).join(' ').toLowerCase();
      const matchesSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.email.toLowerCase().includes(term) ||
        phone.includes(term) ||
        itemHaystack.includes(term) ||
        formatOrderReference(order.id).toLowerCase().includes(term);
      const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'cancelled');
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      inTransit: orders.filter((o) => o.status === 'shipped' || o.status === 'processing')
        .length,
      revenue: active.reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders]);

  const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order updated to ${status}`);
    } catch {
      toast.error('Failed to update order status');
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Orders"
        description="Review and fulfill storefront orders. Click a strip to open full details."
      />

      {!loading && orders.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard label="Total orders" value={stats.total} icon={ShoppingBag} accent="text-foreground" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} accent="text-amber-600" />
          <StatCard label="In progress" value={stats.inTransit} icon={Truck} accent="text-violet-600" />
          <StatCard
            label="Revenue"
            value={formatUGX(stats.revenue)}
            icon={Wallet}
            accent="text-emerald-600"
          />
        </div>
      )}

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/10">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg font-light tracking-tight">
                  Order management
                </CardTitle>
                <CardDescription>
                  {loading
                    ? 'Loading orders…'
                    : `${filteredOrders.length} of ${orders.length} orders`}
                </CardDescription>
              </div>
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search ID, customer, phone, or product…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="h-8 w-full min-w-0 px-1.5 text-[11px] capitalize sm:px-2 sm:text-xs"
                >
                  <span className="truncate">{status}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="bg-muted/15 p-3 sm:p-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-card px-6 py-14 text-center">
              <Package className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">
                {orders.length === 0 ? 'No orders yet' : 'No matching orders'}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {orders.length === 0
                  ? 'Orders from your storefront will appear here.'
                  : 'Try a different search or status filter.'}
              </p>
              {orders.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('All');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredOrders.map((order, index) => (
                <OrderStrip
                  key={order.id}
                  order={order}
                  toneIndex={index}
                  onOpen={setSelectedOrderId}
                  onUpdateStatus={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AdminOrderDialog order={selectedOrder} onClose={closeDialog} />
    </AdminPage>
  );
}
