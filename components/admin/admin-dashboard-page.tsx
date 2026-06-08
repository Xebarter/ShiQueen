'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  DollarSign,
  Edit,
  Loader2,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { subscribeOrders, updateOrderStatus } from '@/lib/firebase/orders';
import { deleteProduct } from '@/lib/firebase/products';
import { subscribeUsers } from '@/lib/firebase/users';
import { useProducts } from '@/lib/products-context';
import { Order, Product, UserProfile } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

const ORDER_STATUS: Record<Order['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-700 ring-amber-500/20' },
  processing: { label: 'Processing', className: 'bg-sky-500/10 text-sky-700 ring-sky-500/20' },
  shipped: { label: 'Shipped', className: 'bg-violet-500/10 text-violet-700 ring-violet-500/20' },
  delivered: { label: 'Delivered', className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-700 ring-red-500/20' },
};

function formatOrderRef(id: string): string {
  if (id.length <= 12) return id.toUpperCase();
  return `#${id.slice(-8).toUpperCase()}`;
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

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  value: string | number;
  icon: typeof ShoppingCart;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm shadow-primary/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn('mt-1 truncate text-2xl font-bold tabular-nums', accent)}>{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn('shrink-0 rounded-lg bg-muted p-2', accent)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function StatusSelect({
  order,
  onUpdate,
}: {
  order: Order;
  onUpdate: (id: string, status: Order['status']) => void;
}) {
  return (
    <select
      value={order.status}
      onChange={(e) => onUpdate(order.id, e.target.value as Order['status'])}
      aria-label={`Update status for order ${formatOrderRef(order.id)}`}
      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs capitalize focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {Object.keys(ORDER_STATUS).map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

function computeTopProducts(orders: Order[]) {
  const sales = new Map<string, { name: string; quantity: number; revenue: number }>();

  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    for (const item of order.items) {
      const current = sales.get(item.productId) ?? {
        name: item.name,
        quantity: 0,
        revenue: 0,
      };
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      sales.set(item.productId, current);
    }
  }

  return Array.from(sales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

export function AdminDashboardPage() {
  const { products, loading: productsLoading } = useProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    const unsubOrders = subscribeOrders(
      (nextOrders) => {
        setOrders(nextOrders);
        setOrdersLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to load orders');
        setOrdersLoading(false);
      }
    );

    const unsubUsers = subscribeUsers(
      (nextUsers) => {
        setUsers(nextUsers);
        setUsersLoading(false);
      },
      (error) => {
        console.error(error);
        setUsersLoading(false);
      }
    );

    return () => {
      unsubOrders();
      unsubUsers();
    };
  }, []);

  const stats = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const revenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const customers = users.filter((u) => u.role === 'customer').length;
    const inStock = products.filter((p) => p.stock > 0 && p.status !== 'Out of Stock').length;
    const lowStock = products.filter((p) => p.status === 'Low Stock' || (p.stock > 0 && p.stock <= 5));

    return { revenue, orderCount: orders.length, pendingOrders, customers, inStock, lowStock };
  }, [orders, users, products]);

  const recentOrders = orders.slice(0, 6);
  const topProducts = useMemo(() => computeTopProducts(orders), [orders]);
  const maxSales = topProducts[0]?.quantity ?? 1;
  const loading = ordersLoading || productsLoading || usersLoading;

  const handleOrderStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order updated to ${status}`);
    } catch {
      toast.error('Failed to update order');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Dashboard"
        description="Live overview from your Firestore database"
        action={
          <Link href="/admin/products/new" className={cn(buttonVariants(), 'gap-2')}>
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard
              label="Revenue"
              value={formatUGX(stats.revenue)}
              icon={DollarSign}
              accent="text-emerald-600"
              hint="Excluding cancelled"
            />
            <StatCard
              label="Orders"
              value={stats.orderCount}
              icon={ShoppingCart}
              accent="text-violet-600"
              hint={stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : undefined}
            />
            <StatCard
              label="Customers"
              value={stats.customers}
              icon={Users}
              accent="text-sky-600"
              hint={`${users.length} registered users`}
            />
            <StatCard
              label="In stock"
              value={stats.inStock}
              icon={Package}
              accent="text-amber-600"
              hint={`${products.length} total products`}
            />
          </div>

          {stats.lowStock.length > 0 && (
            <Card className="mb-6 overflow-hidden border-amber-500/30 shadow-sm">
              <CardHeader className="border-b border-amber-500/20 bg-amber-500/5 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Inventory alerts
                </CardTitle>
                <CardDescription>Products that need attention</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {stats.lowStock.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.stock} left · {product.status}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        aria-label="Delete"
                        onClick={() => handleDeleteProduct(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="overflow-hidden border-border/70 shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-border/60 bg-muted/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-light tracking-tight">Recent orders</CardTitle>
                    <CardDescription>Update status directly from the dashboard</CardDescription>
                  </div>
                  <Link href="/admin/orders">
                    <Button variant="outline" size="sm">
                      View all
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentOrders.length === 0 ? (
                  <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No orders yet. They will appear here when customers checkout.
                  </p>
                ) : (
                  <>
                    <div className="md:hidden">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="border-b border-border/60 px-4 py-3 last:border-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono text-sm font-semibold text-primary">
                                {formatOrderRef(order.id)}
                              </p>
                              <p className="truncate text-sm">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatOrderDate(order.createdAt)}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold">{formatUGX(order.total)}</p>
                              <div className="mt-1 flex justify-end">
                                <OrderStatusBadge status={order.status} />
                              </div>
                            </div>
                          </div>
                          <div className="mt-2.5">
                            <StatusSelect order={order} onUpdate={handleOrderStatusUpdate} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead>
                          <tr className="border-b border-border/60 bg-muted/30">
                            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Order
                            </th>
                            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Customer
                            </th>
                            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Total
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
                          {recentOrders.map((order) => (
                            <tr
                              key={order.id}
                              className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                            >
                              <td className="px-5 py-3.5">
                                <p className="font-mono font-semibold text-primary">
                                  {formatOrderRef(order.id)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatOrderDate(order.createdAt)}
                                </p>
                              </td>
                              <td className="px-5 py-3.5">{order.customerName}</td>
                              <td className="px-5 py-3.5 font-semibold">{formatUGX(order.total)}</td>
                              <td className="px-5 py-3.5">
                                <OrderStatusBadge status={order.status} />
                              </td>
                              <td className="px-5 py-3.5">
                                <StatusSelect order={order} onUpdate={handleOrderStatusUpdate} />
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

            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/10 pb-3">
                <CardTitle className="text-lg font-light tracking-tight">Top products</CardTitle>
                <CardDescription>Best sellers from order history</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sales data will appear once orders are placed.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product.id} className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {index + 1}. {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold">
                            {formatUGX(product.revenue)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${(product.quantity / maxSales) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-8">
            <Link href="/admin/products/new">
              <Button variant="outline" className="min-h-11 w-full">
                Add product
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="min-h-11 w-full">
                Manage orders
              </Button>
            </Link>
            <Link href="/admin/customers">
              <Button variant="outline" className="min-h-11 w-full">
                View customers
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="min-h-11 w-full">
                Store settings
              </Button>
            </Link>
          </div>
        </>
      )}
    </AdminPage>
  );
}
