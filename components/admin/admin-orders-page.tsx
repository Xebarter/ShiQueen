'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { subscribeOrders, updateOrderStatus } from '@/lib/firebase/orders';
import { Order } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['All', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const ORDER_STATUS: Record<Order['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-700 ring-amber-500/20' },
  processing: { label: 'Processing', className: 'bg-sky-500/10 text-sky-700 ring-sky-500/20' },
  shipped: { label: 'Shipped', className: 'bg-violet-500/10 text-violet-700 ring-violet-500/20' },
  delivered: { label: 'Delivered', className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-700 ring-red-500/20' },
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
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
      onChange={(e) => onUpdate(order.id, e.target.value as Order['status'])}
      aria-label={`Update status for order ${formatOrderReference(order.id)}`}
      className={cn(
        'rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs capitalize focus:outline-none focus:ring-2 focus:ring-primary',
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

function MobileOrderRow({
  order,
  onUpdate,
}: {
  order: Order;
  onUpdate: (orderId: string, status: Order['status']) => void;
}) {
  return (
    <div className="border-b border-border/60 px-4 py-3 last:border-0">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-semibold text-primary">
              {formatOrderReference(order.id)}
            </p>
            <OrderStatusBadge status={order.status} />
            <OrderTypeBadge type={order.orderType} />
          </div>
          <p className="mt-0.5 truncate text-sm font-medium">{order.customerName}</p>
          <p className="truncate text-xs text-muted-foreground">{order.email}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">{formatUGX(order.total)}</p>
          <p className="text-[11px] text-muted-foreground">
            {order.items.length} items · {formatOrderDate(order.createdAt)}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">Update status</span>
        <StatusSelect order={order} onUpdate={onUpdate} className="min-w-[7rem]" />
      </div>
    </div>
  );
}

function DesktopOrderRow({
  order,
  onUpdate,
}: {
  order: Order;
  onUpdate: (orderId: string, status: Order['status']) => void;
}) {
  return (
    <tr className="group border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
      <td className="px-5 py-3.5">
        <p className="font-mono text-sm font-semibold text-primary">
          {formatOrderReference(order.id)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatOrderDate(order.createdAt)}</p>
      </td>
      <td className="px-5 py-3.5">
        <p className="font-medium">{order.customerName}</p>
        <p className="truncate text-xs text-muted-foreground">{order.email}</p>
      </td>
      <td className="px-5 py-3.5 text-sm tabular-nums">{order.items.length}</td>
      <td className="px-5 py-3.5 text-sm font-semibold tabular-nums">{formatUGX(order.total)}</td>
      <td className="px-5 py-3.5">
        <OrderTypeBadge type={order.orderType} />
      </td>
      <td className="px-5 py-3.5">
        <OrderStatusBadge status={order.status} />
      </td>
      <td className="px-5 py-3.5">
        <StatusSelect order={order} onUpdate={onUpdate} />
      </td>
    </tr>
  );
}

export function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return orders.filter((order) => {
      const matchesSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.email.toLowerCase().includes(term);
      const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'cancelled');
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      inTransit: orders.filter((o) => o.status === 'shipped' || o.status === 'processing').length,
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
      <AdminPageHeader title="Orders" description="Track and fulfil customer orders" />

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
                <CardTitle className="text-lg font-light tracking-tight">Order management</CardTitle>
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
                  placeholder="Search order ID, customer, or email…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {STATUS_OPTIONS.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="shrink-0 capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="px-6 py-14 text-center">
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
            <>
              <div className="md:hidden">
                {filteredOrders.map((order) => (
                  <MobileOrderRow key={order.id} order={order} onUpdate={handleStatusUpdate} />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[960px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Order
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Customer
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Items
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Total
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Type
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Update
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <DesktopOrderRow
                        key={order.id}
                        order={order}
                        onUpdate={handleStatusUpdate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AdminPage>
  );
}
