'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Globe,
  Loader2,
  MapPin,
  Package,
  ShoppingCart,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import {
  AnalyticsChartCard,
  AnalyticsMetricCard,
  RankedList,
  RevenueTrendChart,
  SharePieChart,
  SimpleBarChart,
  StatusFunnelBars,
} from '@/components/analytics/charts';
import {
  computeBookingKeyMetrics,
  computeBookingMonthlyTrend,
  computeBookingStatusFunnel,
  computeBookingsByWeekday,
  computeKeyMetrics,
  computeListingPerformance,
  computeLocationMix,
  computeMonthlyTrend,
  computeOrderStatusFunnel,
  computeOrderTypeBreakdown,
  computePaymentMethodBreakdown,
  computeSalesByCategory,
  computeTopCountries,
  computeTopProducts,
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
import { useServices } from '@/lib/services-context';
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

type TabId = 'commerce' | 'services';

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
          Set monthly commerce goals to track progress against live order data.
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
  const { bookings, listings, loading: servicesLoading } = useServices();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [goals, setGoals] = useState<AnalyticsGoals>({});
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showGoalsForm, setShowGoalsForm] = useState(false);
  const [tab, setTab] = useState<TabId>('commerce');

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
  const orderFunnel = useMemo(() => computeOrderStatusFunnel(orders), [orders]);
  const topProducts = useMemo(
    () => computeTopProducts(orders, productsById),
    [orders, productsById]
  );
  const orderTypes = useMemo(() => computeOrderTypeBreakdown(orders), [orders]);
  const paymentMethods = useMemo(() => computePaymentMethodBreakdown(orders), [orders]);

  const bookingMetrics = useMemo(() => computeBookingKeyMetrics(bookings), [bookings]);
  const bookingTrend = useMemo(() => computeBookingMonthlyTrend(bookings), [bookings]);
  const bookingFunnel = useMemo(() => computeBookingStatusFunnel(bookings), [bookings]);
  const listingPerf = useMemo(
    () => computeListingPerformance(bookings, listings),
    [bookings, listings]
  );
  const locationMix = useMemo(() => computeLocationMix(bookings), [bookings]);
  const weekdayBookings = useMemo(() => computeBookingsByWeekday(bookings), [bookings]);

  const recentOrders = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').slice(0, 6),
    [orders]
  );

  const loading = ordersLoading || usersLoading || productsLoading || servicesLoading;

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
        description="Live commerce and services performance from orders, bookings, and customers"
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

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            { id: 'commerce' as const, label: 'Commerce', icon: ShoppingCart },
            { id: 'services' as const, label: 'Services', icon: CalendarClock },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
              tab === id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tab === 'commerce' ? (
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
            <AnalyticsMetricCard
              title="Monthly revenue"
              value={formatUGX(metrics.thisMonthRevenue)}
              change={metrics.revenueChange}
              hint={`${formatUGX(metrics.allTimeRevenue)} all-time`}
            />
            <AnalyticsMetricCard
              title="Orders this month"
              value={String(metrics.thisMonthOrderCount)}
              change={metrics.ordersChange}
              hint={`${metrics.allTimeOrders} active orders total`}
            />
            <AnalyticsMetricCard
              title="Average order value"
              value={formatUGX(metrics.averageOrderValue)}
              change={metrics.aovChange}
            />
            <AnalyticsMetricCard
              title="Repeat customer rate"
              value={`${metrics.repeatCustomerRate.toFixed(1)}%`}
              hint={`${metrics.paymentSuccessRate.toFixed(1)}% paid successfully`}
            />
          </div>

          <div className="mb-6">
            <AnalyticsChartCard
              title="Revenue trend"
              description="Monthly revenue and order volume over the last 6 months"
            >
              <RevenueTrendChart
                data={monthlyTrend}
                secondaryKey="orders"
                secondaryLabel="Orders"
              />
            </AnalyticsChartCard>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsChartCard
              title="Order pipeline"
              description="Distribution of orders by fulfillment status"
            >
              <StatusFunnelBars items={orderFunnel} />
            </AnalyticsChartCard>

            <AnalyticsChartCard
              title="Order mix"
              description="Revenue share by order type"
            >
              <SharePieChart
                data={orderTypes.map((t) => ({ name: t.label, value: t.revenue }))}
              />
            </AnalyticsChartCard>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsChartCard
              title="Top markets"
              description="Revenue by shipping country"
              action={<Globe className="h-4 w-4 text-primary" />}
            >
              <SimpleBarChart
                data={topCountries.map((c) => ({
                  label: c.country,
                  revenue: c.revenue,
                }))}
                dataKey="revenue"
                valueFormatter={formatUGX}
                horizontal
                height={Math.max(220, topCountries.length * 36)}
              />
            </AnalyticsChartCard>

            <AnalyticsChartCard
              title="Sales by category"
              description="Units and revenue grouped by product category"
              action={<Package className="h-4 w-4 text-primary" />}
            >
              {salesByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales data yet.</p>
              ) : (
                <RankedList
                  items={salesByCategory.slice(0, 8).map((item) => ({
                    id: item.category,
                    title: item.category,
                    subtitle: `${item.units} units · ${item.percentage}% of revenue`,
                    value: formatUGX(item.revenue),
                  }))}
                />
              )}
            </AnalyticsChartCard>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsChartCard
              title="Top products"
              description="Best sellers by attributed line revenue"
            >
              <RankedList
                items={topProducts.map((p) => ({
                  id: p.productId,
                  title: p.name,
                  subtitle: `${p.units} units · ${p.orders} orders`,
                  value: formatUGX(p.revenue),
                }))}
                emptyMessage="Product sales will appear once orders include catalog items."
              />
            </AnalyticsChartCard>

            <AnalyticsChartCard
              title="Payment methods"
              description="How customers are paying"
            >
              <SharePieChart
                data={paymentMethods.map((m) => ({
                  name: m.label,
                  value: m.count,
                }))}
              />
            </AnalyticsChartCard>
          </div>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="text-lg font-light tracking-tight">Recent orders</CardTitle>
              <CardDescription>Update status to keep the pipeline accurate</CardDescription>
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
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <AnalyticsMetricCard
              title="Monthly earnings"
              value={formatUGX(bookingMetrics.thisMonthEarnings)}
              change={bookingMetrics.earningsChange}
              hint={`${formatUGX(bookingMetrics.allTimeEarnings)} completed all-time`}
            />
            <AnalyticsMetricCard
              title="Bookings this month"
              value={String(bookingMetrics.thisMonthBookings)}
              change={bookingMetrics.bookingsChange}
              hint={`${bookingMetrics.thisWeekBookings} this week`}
            />
            <AnalyticsMetricCard
              title="Avg booking value"
              value={formatUGX(bookingMetrics.averageBookingValue)}
              change={bookingMetrics.abvChange}
            />
            <AnalyticsMetricCard
              title="Completion rate"
              value={`${bookingMetrics.completionRate.toFixed(1)}%`}
              hint={`${bookingMetrics.pendingCount} pending · ${bookingMetrics.paymentSuccessRate.toFixed(1)}% paid`}
            />
          </div>

          <div className="mb-6">
            <AnalyticsChartCard
              title="Earnings trend"
              description="Completed booking earnings and volume over the last 6 months"
            >
              <RevenueTrendChart
                data={bookingTrend.map((r) => ({
                  label: r.label,
                  revenue: r.earnings,
                  orders: r.bookings,
                }))}
                secondaryKey="orders"
                secondaryLabel="Bookings"
              />
            </AnalyticsChartCard>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsChartCard
              title="Booking pipeline"
              description="Where appointments sit in the lifecycle"
            >
              <StatusFunnelBars items={bookingFunnel} />
            </AnalyticsChartCard>

            <AnalyticsChartCard
              title="Studio vs mobile"
              description="Booking mix by location type"
              action={<MapPin className="h-4 w-4 text-primary" />}
            >
              <SharePieChart
                data={locationMix.map((m) => ({ name: m.label, value: m.count }))}
              />
            </AnalyticsChartCard>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsChartCard
              title="Busy days"
              description="Bookings by scheduled weekday"
            >
              <SimpleBarChart
                data={weekdayBookings.map((d) => ({
                  label: d.day,
                  bookings: d.bookings,
                }))}
                dataKey="bookings"
                color="var(--chart-2)"
              />
            </AnalyticsChartCard>

            <AnalyticsChartCard
              title="Top listings"
              description="Services ranked by completed earnings"
            >
              <RankedList
                items={listingPerf.map((l) => ({
                  id: l.listingId,
                  title: l.name,
                  subtitle: `${l.bookings} bookings · ${l.views} views · ${l.conversionRate.toFixed(1)}% conv.`,
                  value: formatUGX(l.earnings),
                  meta: l.rating ? `★ ${l.rating.toFixed(1)}` : undefined,
                }))}
                emptyMessage="Listing performance appears once bookings start."
              />
            </AnalyticsChartCard>
          </div>
        </>
      )}
    </AdminPage>
  );
}
