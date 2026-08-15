import { Order, Product, UserProfile } from '@/lib/types/database';
import type { ServiceBooking, ServiceListing } from '@/lib/types/services';

export function isActiveOrder(order: Order): boolean {
  return order.status !== 'cancelled';
}

export function isActiveBooking(booking: ServiceBooking): boolean {
  return booking.status !== 'cancelled';
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

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-UG', {
    month: 'short',
    year: '2-digit',
  }).format(new Date(year, month - 1));
}

function lastNMonthKeys(n: number, from = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    keys.push(getMonthKey(d));
  }
  return keys;
}

function weekStart(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function previousWeekStart(from = new Date()): Date {
  const start = weekStart(from);
  start.setDate(start.getDate() - 7);
  return start;
}

// ─── Commerce (orders) ───────────────────────────────────────────────────────

export type KeyMetrics = {
  thisMonthRevenue: number;
  revenueChange: number;
  thisMonthOrderCount: number;
  ordersChange: number;
  averageOrderValue: number;
  aovChange: number;
  repeatCustomerRate: number;
  paymentSuccessRate: number;
  allTimeRevenue: number;
  allTimeOrders: number;
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
  const allTimeRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);

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
    allTimeRevenue,
    allTimeOrders: activeOrders.length,
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

export function computeMonthlyTrend(
  orders: Order[],
  users: UserProfile[] = [],
  months = 6
): MonthlyTrendRow[] {
  const keys = lastNMonthKeys(months);
  const bucket = new Map(
    keys.map((key) => [key, { revenue: 0, orders: 0, newCustomers: new Set<string>() }])
  );

  for (const order of orders.filter(isActiveOrder)) {
    const key = getMonthKey(order.createdAt);
    const month = bucket.get(key);
    if (!month) continue;
    month.revenue += order.total;
    month.orders += 1;
  }

  for (const user of users) {
    const key = getMonthKey(user.createdAt);
    const month = bucket.get(key);
    if (!month) continue;
    month.newCustomers.add(user.uid);
  }

  return keys.map((key) => {
    const data = bucket.get(key)!;
    return {
      key,
      label: monthLabel(key),
      revenue: data.revenue,
      orders: data.orders,
      customers: data.newCustomers.size,
      averageOrderValue: data.orders ? data.revenue / data.orders : 0,
    };
  });
}

export type StatusFunnelItem = {
  status: string;
  label: string;
  count: number;
  percentage: number;
};

const ORDER_STATUS_ORDER: Order['status'][] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export function computeOrderStatusFunnel(orders: Order[]): StatusFunnelItem[] {
  const counts = new Map<string, number>();
  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
  }
  const total = orders.length || 1;
  return ORDER_STATUS_ORDER.map((status) => {
    const count = counts.get(status) ?? 0;
    return {
      status,
      label: status.replace(/_/g, ' '),
      count,
      percentage: Math.round((count / total) * 100),
    };
  }).filter((item) => item.count > 0 || item.status !== 'cancelled');
}

export type ProductPerfStat = {
  productId: string;
  name: string;
  units: number;
  revenue: number;
  orders: number;
};

export function computeTopProducts(
  orders: Order[],
  productsById?: Map<string, Product>,
  limit = 8
): ProductPerfStat[] {
  const totals = new Map<string, ProductPerfStat>();

  for (const order of orders.filter(isActiveOrder)) {
    const seenInOrder = new Set<string>();
    for (const item of order.items) {
      if (item.itemType === 'service') continue;
      const id = item.productId || item.name;
      const current = totals.get(id) ?? {
        productId: id,
        name: productsById?.get(item.productId)?.name || item.name,
        units: 0,
        revenue: 0,
        orders: 0,
      };
      current.units += item.quantity;
      current.revenue += item.price * item.quantity;
      if (!seenInOrder.has(id)) {
        current.orders += 1;
        seenInOrder.add(id);
      }
      totals.set(id, current);
    }
  }

  return [...totals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export type NamedShareStat = {
  key: string;
  label: string;
  count: number;
  revenue: number;
  percentage: number;
};

export function computeOrderTypeBreakdown(orders: Order[]): NamedShareStat[] {
  const totals = new Map<string, { count: number; revenue: number }>();
  for (const order of orders.filter(isActiveOrder)) {
    const key = order.orderType || 'retail';
    const current = totals.get(key) ?? { count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += order.total;
    totals.set(key, current);
  }
  const totalRevenue = [...totals.values()].reduce((sum, e) => sum + e.revenue, 0) || 1;
  return [...totals.entries()]
    .map(([key, data]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count: data.count,
      revenue: data.revenue,
      percentage: Math.round((data.revenue / totalRevenue) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function computePaymentMethodBreakdown(orders: Order[]): NamedShareStat[] {
  const totals = new Map<string, { count: number; revenue: number }>();
  for (const order of orders.filter(isActiveOrder)) {
    const key = order.paymentMethod || 'unknown';
    const current = totals.get(key) ?? { count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += order.total;
    totals.set(key, current);
  }
  const totalCount = orders.filter(isActiveOrder).length || 1;
  return [...totals.entries()]
    .map(([key, data]) => ({
      key,
      label: key.replace(/_/g, ' '),
      count: data.count,
      revenue: data.revenue,
      percentage: Math.round((data.count / totalCount) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── Supplier-scoped commerce ────────────────────────────────────────────────

export type SupplierKeyMetrics = {
  thisMonthRevenue: number;
  revenueChange: number;
  thisMonthOrderCount: number;
  ordersChange: number;
  averageOrderValue: number;
  aovChange: number;
  allTimeRevenue: number;
  allTimeOrders: number;
  unitsSoldThisMonth: number;
  paymentSuccessRate: number;
};

/** Attribute line-item revenue to a supplier via product ownership. */
export function supplierLineRevenue(
  order: Order,
  supplierId: string,
  productsById: Map<string, Product>
): { revenue: number; units: number } {
  let revenue = 0;
  let units = 0;
  for (const item of order.items) {
    if (item.itemType === 'service') continue;
    const product = productsById.get(item.productId);
    if (product?.supplierId === supplierId) {
      revenue += item.price * item.quantity;
      units += item.quantity;
    }
  }
  // Fallback when items lack matching products but order is tagged for this supplier
  if (revenue === 0 && order.supplierIds?.includes(supplierId)) {
    return { revenue: order.total, units: order.items.reduce((s, i) => s + i.quantity, 0) };
  }
  return { revenue, units };
}

export function computeSupplierKeyMetrics(
  orders: Order[],
  supplierId: string,
  productsById: Map<string, Product>
): SupplierKeyMetrics {
  const now = new Date();
  const thisMonth = getMonthKey(now);
  const lastMonth = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const attributed = orders
    .filter(isActiveOrder)
    .map((order) => {
      const { revenue, units } = supplierLineRevenue(order, supplierId, productsById);
      return { order, revenue, units, month: getMonthKey(order.createdAt) };
    })
    .filter((row) => row.revenue > 0);

  const thisMonthRows = attributed.filter((r) => r.month === thisMonth);
  const lastMonthRows = attributed.filter((r) => r.month === lastMonth);

  const thisMonthRevenue = thisMonthRows.reduce((s, r) => s + r.revenue, 0);
  const lastMonthRevenue = lastMonthRows.reduce((s, r) => s + r.revenue, 0);
  const allTimeRevenue = attributed.reduce((s, r) => s + r.revenue, 0);

  const averageOrderValue = thisMonthRows.length ? thisMonthRevenue / thisMonthRows.length : 0;
  const lastAov = lastMonthRows.length ? lastMonthRevenue / lastMonthRows.length : 0;

  const paid = attributed.filter((r) => r.order.paymentStatus === 'paid').length;

  return {
    thisMonthRevenue,
    revenueChange: percentChange(thisMonthRevenue, lastMonthRevenue),
    thisMonthOrderCount: thisMonthRows.length,
    ordersChange: percentChange(thisMonthRows.length, lastMonthRows.length),
    averageOrderValue,
    aovChange: percentChange(averageOrderValue, lastAov),
    allTimeRevenue,
    allTimeOrders: attributed.length,
    unitsSoldThisMonth: thisMonthRows.reduce((s, r) => s + r.units, 0),
    paymentSuccessRate: attributed.length ? (paid / attributed.length) * 100 : 0,
  };
}

export function computeSupplierMonthlyTrend(
  orders: Order[],
  supplierId: string,
  productsById: Map<string, Product>,
  months = 6
): MonthlyTrendRow[] {
  const keys = lastNMonthKeys(months);
  const bucket = new Map(keys.map((key) => [key, { revenue: 0, orders: 0 }]));

  for (const order of orders.filter(isActiveOrder)) {
    const key = getMonthKey(order.createdAt);
    const month = bucket.get(key);
    if (!month) continue;
    const { revenue } = supplierLineRevenue(order, supplierId, productsById);
    if (revenue <= 0) continue;
    month.revenue += revenue;
    month.orders += 1;
  }

  return keys.map((key) => {
    const data = bucket.get(key)!;
    return {
      key,
      label: monthLabel(key),
      revenue: data.revenue,
      orders: data.orders,
      customers: 0,
      averageOrderValue: data.orders ? data.revenue / data.orders : 0,
    };
  });
}

export function computeSupplierTopProducts(
  orders: Order[],
  supplierId: string,
  productsById: Map<string, Product>,
  limit = 8
): ProductPerfStat[] {
  const totals = new Map<string, ProductPerfStat>();

  for (const order of orders.filter(isActiveOrder)) {
    const seen = new Set<string>();
    for (const item of order.items) {
      if (item.itemType === 'service') continue;
      const product = productsById.get(item.productId);
      if (product?.supplierId !== supplierId) continue;
      const current = totals.get(product.id) ?? {
        productId: product.id,
        name: product.name,
        units: 0,
        revenue: 0,
        orders: 0,
      };
      current.units += item.quantity;
      current.revenue += item.price * item.quantity;
      if (!seen.has(product.id)) {
        current.orders += 1;
        seen.add(product.id);
      }
      totals.set(product.id, current);
    }
  }

  return [...totals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function computeSupplierCategorySales(
  orders: Order[],
  supplierId: string,
  productsById: Map<string, Product>
): CategoryStat[] {
  const totals = new Map<string, { units: number; revenue: number }>();

  for (const order of orders.filter(isActiveOrder)) {
    for (const item of order.items) {
      const product = productsById.get(item.productId);
      if (product?.supplierId !== supplierId) continue;
      const category = product.category || 'Uncategorized';
      const current = totals.get(category) ?? { units: 0, revenue: 0 };
      current.units += item.quantity;
      current.revenue += item.price * item.quantity;
      totals.set(category, current);
    }
  }

  const totalRevenue = [...totals.values()].reduce((sum, e) => sum + e.revenue, 0);
  return [...totals.entries()]
    .map(([category, data]) => ({
      category,
      units: data.units,
      revenue: data.revenue,
      percentage: totalRevenue ? Math.round((data.revenue / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ─── Services / bookings ─────────────────────────────────────────────────────

export type BookingKeyMetrics = {
  thisMonthEarnings: number;
  earningsChange: number;
  thisMonthBookings: number;
  bookingsChange: number;
  averageBookingValue: number;
  abvChange: number;
  completionRate: number;
  paymentSuccessRate: number;
  thisWeekBookings: number;
  weekChange: number;
  allTimeEarnings: number;
  allTimeBookings: number;
  pendingCount: number;
};

export function computeBookingKeyMetrics(bookings: ServiceBooking[]): BookingKeyMetrics {
  const now = new Date();
  const thisMonth = getMonthKey(now);
  const lastMonth = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const thisWeek = weekStart(now);
  const lastWeek = previousWeekStart(now);
  const lastWeekEnd = weekStart(now);

  const active = bookings.filter(isActiveBooking);
  const completed = bookings.filter((b) => b.status === 'completed');

  const thisMonthCompleted = completed.filter((b) => getMonthKey(b.createdAt) === thisMonth);
  const lastMonthCompleted = completed.filter((b) => getMonthKey(b.createdAt) === lastMonth);
  const thisMonthActive = active.filter((b) => getMonthKey(b.createdAt) === thisMonth);
  const lastMonthActive = active.filter((b) => getMonthKey(b.createdAt) === lastMonth);

  const thisMonthEarnings = thisMonthCompleted.reduce((s, b) => s + b.total, 0);
  const lastMonthEarnings = lastMonthCompleted.reduce((s, b) => s + b.total, 0);

  const averageBookingValue = thisMonthCompleted.length
    ? thisMonthEarnings / thisMonthCompleted.length
    : 0;
  const lastAbv = lastMonthCompleted.length
    ? lastMonthEarnings / lastMonthCompleted.length
    : 0;

  const thisWeekBookings = active.filter((b) => b.createdAt >= thisWeek).length;
  const prevWeekBookings = active.filter(
    (b) => b.createdAt >= lastWeek && b.createdAt < lastWeekEnd
  ).length;

  const paid = active.filter((b) => b.paymentStatus === 'paid').length;
  const completionRate = bookings.length
    ? (completed.length / bookings.length) * 100
    : 0;

  return {
    thisMonthEarnings,
    earningsChange: percentChange(thisMonthEarnings, lastMonthEarnings),
    thisMonthBookings: thisMonthActive.length,
    bookingsChange: percentChange(thisMonthActive.length, lastMonthActive.length),
    averageBookingValue,
    abvChange: percentChange(averageBookingValue, lastAbv),
    completionRate,
    paymentSuccessRate: active.length ? (paid / active.length) * 100 : 0,
    thisWeekBookings,
    weekChange: percentChange(thisWeekBookings, prevWeekBookings),
    allTimeEarnings: completed.reduce((s, b) => s + b.total, 0),
    allTimeBookings: active.length,
    pendingCount: bookings.filter((b) => b.status === 'pending').length,
  };
}

export type BookingMonthlyTrendRow = {
  key: string;
  label: string;
  earnings: number;
  bookings: number;
  completed: number;
  averageValue: number;
};

export function computeBookingMonthlyTrend(
  bookings: ServiceBooking[],
  months = 6
): BookingMonthlyTrendRow[] {
  const keys = lastNMonthKeys(months);
  const bucket = new Map(
    keys.map((key) => [key, { earnings: 0, bookings: 0, completed: 0 }])
  );

  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue;
    const key = getMonthKey(booking.createdAt);
    const month = bucket.get(key);
    if (!month) continue;
    month.bookings += 1;
    if (booking.status === 'completed') {
      month.completed += 1;
      month.earnings += booking.total;
    }
  }

  return keys.map((key) => {
    const data = bucket.get(key)!;
    return {
      key,
      label: monthLabel(key),
      earnings: data.earnings,
      bookings: data.bookings,
      completed: data.completed,
      averageValue: data.completed ? data.earnings / data.completed : 0,
    };
  });
}

const BOOKING_STATUS_ORDER: ServiceBooking['status'][] = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

export function computeBookingStatusFunnel(bookings: ServiceBooking[]): StatusFunnelItem[] {
  const counts = new Map<string, number>();
  for (const booking of bookings) {
    counts.set(booking.status, (counts.get(booking.status) ?? 0) + 1);
  }
  const total = bookings.length || 1;
  return BOOKING_STATUS_ORDER.map((status) => {
    const count = counts.get(status) ?? 0;
    return {
      status,
      label: status.replace(/_/g, ' '),
      count,
      percentage: Math.round((count / total) * 100),
    };
  });
}

export type ListingPerfStat = {
  listingId: string;
  name: string;
  bookings: number;
  earnings: number;
  views: number;
  conversionRate: number;
  rating: number;
};

export function computeListingPerformance(
  bookings: ServiceBooking[],
  listings: ServiceListing[],
  limit = 8
): ListingPerfStat[] {
  const byId = new Map(
    listings.map((l) => [
      l.id,
      {
        listingId: l.id,
        name: l.name,
        bookings: 0,
        earnings: 0,
        views: l.viewCount,
        conversionRate: 0,
        rating: l.rating,
      } satisfies ListingPerfStat,
    ])
  );

  for (const booking of bookings.filter(isActiveBooking)) {
    const row = byId.get(booking.serviceId);
    if (!row) continue;
    row.bookings += 1;
    if (booking.status === 'completed') row.earnings += booking.total;
  }

  return [...byId.values()]
    .map((row) => ({
      ...row,
      conversionRate: row.views ? (row.bookings / row.views) * 100 : 0,
    }))
    .sort((a, b) => b.earnings - a.earnings || b.bookings - a.bookings)
    .slice(0, limit);
}

export function computeLocationMix(bookings: ServiceBooking[]): NamedShareStat[] {
  const totals = new Map<string, { count: number; revenue: number }>();
  for (const booking of bookings.filter(isActiveBooking)) {
    const key = booking.locationType || 'studio';
    const current = totals.get(key) ?? { count: 0, revenue: 0 };
    current.count += 1;
    if (booking.status === 'completed') current.revenue += booking.total;
    totals.set(key, current);
  }
  const totalCount = [...totals.values()].reduce((s, e) => s + e.count, 0) || 1;
  return [...totals.entries()]
    .map(([key, data]) => ({
      key,
      label: key === 'mobile' ? 'Mobile' : 'In studio',
      count: data.count,
      revenue: data.revenue,
      percentage: Math.round((data.count / totalCount) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export type WeekdayStat = {
  day: string;
  bookings: number;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function computeBookingsByWeekday(bookings: ServiceBooking[]): WeekdayStat[] {
  const counts = Array.from({ length: 7 }, () => 0);
  for (const booking of bookings.filter(isActiveBooking)) {
    // Prefer scheduled date when available
    const scheduled = booking.date ? new Date(booking.date) : booking.createdAt;
    if (Number.isNaN(scheduled.getTime())) continue;
    counts[scheduled.getDay()] += 1;
  }
  return WEEKDAYS.map((day, i) => ({ day, bookings: counts[i] }));
}
