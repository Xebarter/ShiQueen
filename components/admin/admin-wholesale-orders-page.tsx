'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Loader2, Package, Search, ShoppingCart, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import {
  AdminWholesaleBackLink,
  BULK_ORDER_STATUS,
  BulkOrderStatusBadge,
  formatWholesaleDate,
  formatWholesaleRef,
  StatCard,
} from '@/components/admin/admin-wholesale-shared';
import { useWholesale } from '@/lib/wholesale-context';
import { BulkOrder } from '@/lib/types/wholesale';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = ['All', 'pending', 'approved', 'shipped', 'delivered', 'cancelled'] as const;

function StatusSelect({
  order,
  onUpdate,
  className,
}: {
  order: BulkOrder;
  onUpdate: (id: string, status: BulkOrder['status']) => void;
  className?: string;
}) {
  return (
    <select
      value={order.status}
      onChange={(e) => onUpdate(order.id, e.target.value as BulkOrder['status'])}
      aria-label={`Update status for order ${formatWholesaleRef(order.id)}`}
      className={cn(
        'rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs capitalize focus:outline-none focus:ring-2 focus:ring-primary',
        className
      )}
    >
      {Object.keys(BULK_ORDER_STATUS).map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

export function AdminWholesaleOrdersPage() {
  const { bulkOrders, updateBulkOrder, loading } = useWholesale();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return bulkOrders.filter((order) => {
      const matchesSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.customerId.toLowerCase().includes(term);
      const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [bulkOrders, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const active = bulkOrders.filter((o) => o.status !== 'cancelled');
    return {
      total: bulkOrders.length,
      pending: bulkOrders.filter((o) => o.status === 'pending' || o.status === 'draft').length,
      inProgress: bulkOrders.filter((o) => o.status === 'approved' || o.status === 'shipped').length,
      revenue: active.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  }, [bulkOrders]);

  const handleStatusUpdate = async (id: string, status: BulkOrder['status']) => {
    try {
      await updateBulkOrder(id, { status });
      toast.success(`Order updated to ${status}`);
    } catch {
      toast.error('Failed to update order');
    }
  };

  return (
    <AdminPage>
      <AdminWholesaleBackLink href="/admin/wholesale" label="Back to wholesale" />

      <AdminPageHeader title="Bulk orders" description="Review and fulfil wholesale orders" />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {bulkOrders.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <StatCard label="Total orders" value={stats.total} icon={ShoppingCart} accent="text-foreground" />
              <StatCard label="Pending" value={stats.pending} icon={Clock} accent="text-amber-600" />
              <StatCard label="In progress" value={stats.inProgress} icon={Package} accent="text-violet-600" />
              <StatCard label="Revenue" value={formatUGX(stats.revenue)} icon={Wallet} accent="text-emerald-600" />
            </div>
          )}

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <div className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-lg font-light tracking-tight">Order management</CardTitle>
                    <CardDescription>
                      {filteredOrders.length} of {bulkOrders.length} orders
                    </CardDescription>
                  </div>
                  <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder="Search order ID or customer…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {STATUS_FILTERS.map((status) => (
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
              {bulkOrders.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <ShoppingCart className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold">No bulk orders yet</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Orders appear here when customers checkout from the bulk order builder.
                  </p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-muted-foreground">No orders match your filters.</p>
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
                </div>
              ) : (
                <>
                  <div className="md:hidden">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="border-b border-border/60 px-4 py-3 last:border-0">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/admin/wholesale/orders/${order.id}`}
                                className="font-mono text-sm font-semibold text-primary hover:underline"
                              >
                                {formatWholesaleRef(order.id)}
                              </Link>
                              <BulkOrderStatusBadge status={order.status} />
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                              {order.orderType} · {order.items.length} items
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold tabular-nums">
                              {formatUGX(order.totalAmount)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatWholesaleDate(order.requestedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground">Update status</span>
                          <StatusSelect order={order} onUpdate={handleStatusUpdate} className="min-w-[7rem]" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[900px] text-sm">
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
                          <tr
                            key={order.id}
                            className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                          >
                            <td className="px-5 py-3.5">
                              <Link
                                href={`/admin/wholesale/orders/${order.id}`}
                                className="font-mono text-sm font-semibold text-primary hover:underline"
                              >
                                {formatWholesaleRef(order.id)}
                              </Link>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatWholesaleDate(order.requestedAt)}
                              </p>
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground">{order.customerId}</td>
                            <td className="px-5 py-3.5 tabular-nums">{order.items.length}</td>
                            <td className="px-5 py-3.5 font-semibold tabular-nums">
                              {formatUGX(order.totalAmount)}
                            </td>
                            <td className="px-5 py-3.5 capitalize text-muted-foreground">
                              {order.orderType}
                            </td>
                            <td className="px-5 py-3.5">
                              <BulkOrderStatusBadge status={order.status} />
                            </td>
                            <td className="px-5 py-3.5">
                              <StatusSelect order={order} onUpdate={handleStatusUpdate} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AdminPage>
  );
}
