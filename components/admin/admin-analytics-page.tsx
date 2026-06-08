'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Globe,
  Loader2,
  ShoppingCart,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import {
  computeKeyMetrics,
  computeMonthlyTrend,
  computeSalesByCategory,
  computeTopCountries,
  formatPercentChange,
  trendFromChange,
} from '@/lib/analytics/compute';
import {
  AnalyticsGoals,
  clearAnalyticsGoals,
  saveAnalyticsGoals,
  subscribeAnalyticsGoals,
} from '@/lib/firebase/analytics-goals';
import { subscribeOrders, updateOrderStatus } from '@/lib/firebase/orders';
import { subscribeUsers } from '@/lib/firebase/users';
import { useProducts } from '@/lib/products-context';
import { Order, UserProfile } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

const ORDER_STATUS: Order['status'][] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

function MetricCard({
  title,
  value,
  change,
  hint,
}: {
  title: string;
  value: string;
  change?: number;
  hint?: string;
}) {
  const trend = change !== undefined ? trendFromChange(change) : 'flat';
  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm shadow-primary/5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        {change !== undefined && (
          <TrendIcon
            className={cn(
              'h-4 w-4 shrink-0',
              trend === 'up' && 'text-emerald-600',
              trend === 'down' && 'text-red-600',
              trend === 'flat' && 'text-muted-foreground'
            )}
          />
        )}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {change !== undefined && (
        <p
          className={cn(
            'mt-1 text-xs',
            trend === 'up' && 'text-emerald-600',
            trend === 'down' && 'text-red-600',
            trend === 'flat' && 'text-muted-foreground'
          )}
        >
          {formatPercentChange(change)} vs last month
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function GoalsFormPanel({
  goals,
  onClose,
}: {
  goals: AnalyticsGoals;
  onClose: () => void;
}) {
  const [revenueTarget, setRevenueTarget] = useState('');
  const [ordersTarget, setOrdersTarget] = useState('');
  const [aovTarget, setAovTarget] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRevenueTarget(goals.monthlyRevenueTarget?.toString() ?? '');
    setOrdersTarget(goals.monthlyOrdersTarget?.toString() ?? '');
    setAovTarget(goals.averageOrderValueTarget?.toString() ?? '');
  }, [goals]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAnalyticsGoals({
        monthlyRevenueTarget: revenueTarget ? Number(revenueTarget) : undefined,
        monthlyOrdersTarget: ordersTarget ? Number(ordersTarget) : undefined,
        averageOrderValueTarget: aovTarget ? Number(aovTarget) : undefined,
      });
      toast.success('KPI targets saved');
      onClose();
    } catch {
      toast.error('Failed to save targets');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all KPI targets?')) return;
    try {
      await clearAnalyticsGoals();
      toast.success('Targets cleared');
      onClose();
    } catch {
      toast.error('Failed to clear targets');
    }
  };

  return (
    <Card className="mb-6 overflow-hidden border-primary/20 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/10 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            KPI targets
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Set monthly goals in Firestore to track progress against live data.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="revenue-target" className="text-sm font-medium">
              Revenue target (UGX)
            </label>
            <input
              id="revenue-target"
              type="number"
              min={0}
              value={revenueTarget}
              onChange={(e) => setRevenueTarget(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="1000000"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="orders-target" className="text-sm font-medium">
              Orders target
            </label>
            <input
              id="orders-target"
              type="number"
              min={0}
              value={ordersTarget}
              onChange={(e) => setOrdersTarget(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="50"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="aov-target" className="text-sm font-medium">
              Avg order value (UGX)
            </label>
            <input
              id="aov-target"
              type="number"
              min={0}
              value={aovTarget}
              onChange={(e) => setAovTarget(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="150000"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save targets
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {(goals.monthlyRevenueTarget ||
              goals.monthlyOrdersTarget ||
              goals.averageOrderValueTarget) && (
              <Button
                type="button"
                variant="ghost"
                className="gap-2 text-red-600 hover:text-red-700"
                onClick={handleClear}
              >
                <Trash2 className="h-4 w-4" />
                Clear targets
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function GoalProgress({
  label,
  current,
  target,
  formatValue = formatUGX,
}: {
  label: string;
  current: number;
  target?: number;
  formatValue?: (value: number) => string;
}) {
  if (!target || target <= 0) return null;
  const progress = Math.min(100, Math.round((current / target) * 100));

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          {progress}% of {formatValue(target)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function OrderStatusSelect({
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
      aria-label={`Update status for order ${order.id}`}
      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs capitalize focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {ORDER_STATUS.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

export function AdminAnalyticsPage() {
  const { products, loading: productsLoading } = useProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [goals, setGoals] = useState<AnalyticsGoals>({});
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showGoalsForm, setShowGoalsForm] = useState(false);

  useEffect(() => {
    const unsubOrders = subscribeOrders(
      (next) => {
        setOrders(next);
        setOrdersLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to load orders');
        setOrdersLoading(false);
      }
    );

    const unsubUsers = subscribeUsers(
      (next) => {
        setUsers(next);
        setUsersLoading(false);
      },
      () => setUsersLoading(false)
    );

    const unsubGoals = subscribeAnalyticsGoals(setGoals, (error) => {
      console.error(error);
    });

    return () => {
      unsubOrders();
      unsubUsers();
      unsubGoals();
    };
  }, []);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const metrics = useMemo(() => computeKeyMetrics(orders), [orders]);
  const topCountries = useMemo(() => computeTopCountries(orders), [orders]);
  const salesByCategory = useMemo(
    () => computeSalesByCategory(orders, productsById),
    [orders, productsById]
  );
  const monthlyTrend = useMemo(() => computeMonthlyTrend(orders, users), [orders, users]);
  const maxCountryOrders = topCountries[0]?.orders ?? 1;

  const recentOrders = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').slice(0, 5),
    [orders]
  );

  const loading = ordersLoading || usersLoading || productsLoading;

  const handleOrderStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order updated to ${status}`);
    } catch {
      toast.error('Failed to update order');
    }
  };

  const hasGoals =
    goals.monthlyRevenueTarget !== undefined ||
    goals.monthlyOrdersTarget !== undefined ||
    goals.averageOrderValueTarget !== undefined;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Analytics"
        description="Live performance metrics from Firestore orders and customers"
        action={
          <Button className="gap-2" onClick={() => setShowGoalsForm(true)}>
            <Target className="h-4 w-4" />
            {hasGoals ? 'Edit targets' : 'Set targets'}
          </Button>
        }
      />

      {showGoalsForm && (
        <GoalsFormPanel goals={goals} onClose={() => setShowGoalsForm(false)} />
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {hasGoals && (
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <GoalProgress
                label="Monthly revenue"
                current={metrics.thisMonthRevenue}
                target={goals.monthlyRevenueTarget}
              />
              <GoalProgress
                label="Monthly orders"
                current={metrics.thisMonthOrderCount}
                target={goals.monthlyOrdersTarget}
                formatValue={(value) => value.toLocaleString()}
              />
              <GoalProgress
                label="Average order value"
                current={metrics.averageOrderValue}
                target={goals.averageOrderValueTarget}
              />
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <MetricCard
              title="Monthly revenue"
              value={formatUGX(metrics.thisMonthRevenue)}
              change={metrics.revenueChange}
            />
            <MetricCard
              title="Orders this month"
              value={metrics.thisMonthOrderCount}
              change={metrics.ordersChange}
            />
            <MetricCard
              title="Average order value"
              value={formatUGX(metrics.averageOrderValue)}
              change={metrics.aovChange}
            />
            <MetricCard
              title="Repeat customer rate"
              value={`${metrics.repeatCustomerRate.toFixed(1)}%`}
              hint={`${metrics.paymentSuccessRate.toFixed(1)}% paid successfully`}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/10">
                <CardTitle className="flex items-center gap-2 text-lg font-light tracking-tight">
                  <Globe className="h-5 w-5 text-primary" />
                  Top markets
                </CardTitle>
                <CardDescription>Revenue and orders by shipping country</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                {topCountries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No order data yet.</p>
                ) : (
                  <div className="space-y-4">
                    {topCountries.map((item, index) => (
                      <div
                        key={item.country}
                        className="border-b border-border/60 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              {index + 1}. {item.country}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.orders} orders</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatUGX(item.revenue)}</p>
                            <p
                              className={cn(
                                'text-xs',
                                item.growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                              )}
                            >
                              {formatPercentChange(item.growth)} vs last month
                            </p>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${(item.orders / maxCountryOrders) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/10">
                <CardTitle className="flex items-center gap-2 text-lg font-light tracking-tight">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Sales by category
                </CardTitle>
                <CardDescription>Units sold grouped by product category</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                {salesByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales data yet.</p>
                ) : (
                  <div className="space-y-4">
                    {salesByCategory.map((item) => (
                      <div
                        key={item.category}
                        className="border-b border-border/60 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{item.category}</p>
                            <p className="text-xs text-muted-foreground">{item.units} units sold</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatUGX(item.revenue)}</p>
                            <p className="text-xs font-medium text-primary">{item.percentage}% of total</p>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-accent transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6 overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="text-lg font-light tracking-tight">Monthly trend</CardTitle>
              <CardDescription>Revenue, orders, and new sign-ups over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {monthlyTrend.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  Trend data will appear once you have orders or sign-ups.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Month
                        </th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Revenue
                        </th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Orders
                        </th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          New customers
                        </th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Avg order value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyTrend.map((row) => (
                        <tr
                          key={row.key}
                          className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-5 py-3.5 font-medium">{row.label}</td>
                          <td className="px-5 py-3.5 font-semibold">{formatUGX(row.revenue)}</td>
                          <td className="px-5 py-3.5 tabular-nums">{row.orders}</td>
                          <td className="px-5 py-3.5 tabular-nums">{row.customers}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {formatUGX(row.averageOrderValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="text-lg font-light tracking-tight">Recent orders</CardTitle>
              <CardDescription>Update order status to keep analytics accurate</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <>
                  <div className="md:hidden">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col gap-2 border-b border-border/60 px-4 py-3 last:border-0"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.email}</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold">{formatUGX(order.total)}</p>
                        </div>
                        <OrderStatusSelect order={order} onUpdate={handleOrderStatusUpdate} />
                      </div>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/30">
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
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground">{order.email}</p>
                            </td>
                            <td className="px-5 py-3.5 font-semibold">{formatUGX(order.total)}</td>
                            <td className="px-5 py-3.5 capitalize text-muted-foreground">
                              {order.status}
                            </td>
                            <td className="px-5 py-3.5">
                              <OrderStatusSelect order={order} onUpdate={handleOrderStatusUpdate} />
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
