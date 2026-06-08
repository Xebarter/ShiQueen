import { Order, Product, UserProfile } from '@/lib/types/database';

export function isActiveOrder(order: Order): boolean {
  return order.status !== 'cancelled';
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatPercentChange(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export type MetricTrend = 'up' | 'down' | 'flat';

export function trendFromChange(change: number): MetricTrend {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'flat';
}

export type KeyMetrics = {
  thisMonthRevenue: number;
  revenueChange: number;
  thisMonthOrderCount: number;
  ordersChange: number;
  averageOrderValue: number;
  aovChange: number;
  repeatCustomerRate: number;
  paymentSuccessRate: number;
};

export function computeKeyMetrics(orders: Order[]): KeyMetrics {
  const now = new Date();
  const thisMonth = getMonthKey(now);
  const lastMonth = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const activeOrders = orders.filter(isActiveOrder);
  const thisMonthOrders = activeOrders.filter((o) => getMonthKey(o.createdAt) === thisMonth);
  const lastMonthOrders = activeOrders.filter((o) => getMonthKey(o.createdAt) === lastMonth);

  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.total, 0);
  const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.total, 0);

  const averageOrderValue = thisMonthOrders.length
    ? thisMonthRevenue / thisMonthOrders.length
    : 0;
  const lastAov = lastMonthOrders.length
    ? lastMonthOrders.reduce((sum, o) => sum + o.total, 0) / lastMonthOrders.length
    : 0;

  const emailOrderCount = new Map<string, number>();
  for (const order of activeOrders) {
    const email = order.email.toLowerCase();
    emailOrderCount.set(email, (emailOrderCount.get(email) ?? 0) + 1);
  }
  const totalCustomers = emailOrderCount.size;
  const repeatCustomers = [...emailOrderCount.values()].filter((count) => count >= 2).length;
  const repeatCustomerRate = totalCustomers ? (repeatCustomers / totalCustomers) * 100 : 0;

  const paidOrders = activeOrders.filter((o) => o.paymentStatus === 'paid').length;
  const paymentSuccessRate = activeOrders.length ? (paidOrders / activeOrders.length) * 100 : 0;

  return {
    thisMonthRevenue,
    revenueChange: percentChange(thisMonthRevenue, lastMonthRevenue),
    thisMonthOrderCount: thisMonthOrders.length,
    ordersChange: percentChange(thisMonthOrders.length, lastMonthOrders.length),
    averageOrderValue,
    aovChange: percentChange(averageOrderValue, lastAov),
    repeatCustomerRate,
    paymentSuccessRate,
  };
}

export type CountryStat = {
  country: string;
  orders: number;
  revenue: number;
  growth: number;
};

export function computeTopCountries(orders: Order[]): CountryStat[] {
  const now = new Date();
  const thisMonth = getMonthKey(now);
  const lastMonth = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const totals = new Map<string, { orders: number; revenue: number }>();
  const thisMonthByCountry = new Map<string, number>();
  const lastMonthByCountry = new Map<string, number>();

  for (const order of orders.filter(isActiveOrder)) {
    const country = order.shippingAddress?.country?.trim() || 'Unknown';
    const current = totals.get(country) ?? { orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += order.total;
    totals.set(country, current);

    const monthKey = getMonthKey(order.createdAt);
    if (monthKey === thisMonth) {
      thisMonthByCountry.set(country, (thisMonthByCountry.get(country) ?? 0) + order.total);
    } else if (monthKey === lastMonth) {
      lastMonthByCountry.set(country, (lastMonthByCountry.get(country) ?? 0) + order.total);
    }
  }

  return [...totals.entries()]
    .map(([country, data]) => ({
      country,
      orders: data.orders,
      revenue: data.revenue,
      growth: percentChange(thisMonthByCountry.get(country) ?? 0, lastMonthByCountry.get(country) ?? 0),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

export type CategoryStat = {
  category: string;
  units: number;
  revenue: number;
  percentage: number;
};

export function computeSalesByCategory(
  orders: Order[],
  productsById: Map<string, Product>
): CategoryStat[] {
  const totals = new Map<string, { units: number; revenue: number }>();

  for (const order of orders.filter(isActiveOrder)) {
    for (const item of order.items) {
      const product = productsById.get(item.productId);
      const category = product?.category || 'Uncategorized';
      const current = totals.get(category) ?? { units: 0, revenue: 0 };
      current.units += item.quantity;
      current.revenue += item.price * item.quantity;
      totals.set(category, current);
    }
  }

  const totalRevenue = [...totals.values()].reduce((sum, entry) => sum + entry.revenue, 0);

  return [...totals.entries()]
    .map(([category, data]) => ({
      category,
      units: data.units,
      revenue: data.revenue,
      percentage: totalRevenue ? Math.round((data.revenue / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export type MonthlyTrendRow = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  customers: number;
  averageOrderValue: number;
};

export function computeMonthlyTrend(orders: Order[], users: UserProfile[]): MonthlyTrendRow[] {
  const months = new Map<
    string,
    { revenue: number; orders: number; newCustomers: Set<string> }
  >();

  for (const order of orders.filter(isActiveOrder)) {
    const key = getMonthKey(order.createdAt);
    const month = months.get(key) ?? { revenue: 0, orders: 0, newCustomers: new Set<string>() };
    month.revenue += order.total;
    month.orders += 1;
    months.set(key, month);
  }

  for (const user of users) {
    const key = getMonthKey(user.createdAt);
    const month = months.get(key) ?? { revenue: 0, orders: 0, newCustomers: new Set<string>() };
    month.newCustomers.add(user.uid);
    months.set(key, month);
  }

  return [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, data]) => {
      const [year, month] = key.split('-').map(Number);
      const label = new Intl.DateTimeFormat('en-UG', {
        month: 'short',
        year: '2-digit',
      }).format(new Date(year, month - 1));

      return {
        key,
        label,
        revenue: data.revenue,
        orders: data.orders,
        customers: data.newCustomers.size,
        averageOrderValue: data.orders ? data.revenue / data.orders : 0,
      };
    });
}
