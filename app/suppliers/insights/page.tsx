'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Loader2,
  Package,
  Plus,
  Warehouse,
} from 'lucide-react';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { ApprovedActionLink } from '@/components/partner/approved-action-link';
import {
  PartnerCard,
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
  PartnerSectionLabel,
  PartnerStatCard,
} from '@/components/partner/partner-page';
import {
  AnalyticsChartCard,
  AnalyticsMetricCard,
  RankedList,
  RevenueTrendChart,
  SharePieChart,
  StatusFunnelBars,
} from '@/components/analytics/charts';
import {
  computeOrderStatusFunnel,
  computeSupplierCategorySales,
  computeSupplierKeyMetrics,
  computeSupplierMonthlyTrend,
  computeSupplierTopProducts,
} from '@/lib/analytics/compute';
import { useAuth } from '@/lib/auth-context';
import { useProducts } from '@/lib/products-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { getSupplierCatalogCounts } from '@/lib/firebase/suppliers';
import { subscribeOrdersForSupplier } from '@/lib/firebase/orders';
import { subscribePackages } from '@/lib/firebase/wholesale';
import type { Package as WholesalePackage } from '@/lib/types/wholesale';
import type { Order } from '@/lib/types/database';
import { canListCatalog } from '@/lib/partner-status';
import { formatUGX } from '@/lib/wholesale-data';

export default function SupplierInsightsPage() {
  const { supplierId } = useAuth();
  const { getSupplierById } = useSuppliers();
  const { products, loading: productsLoading } = useProducts();
  const [packages, setPackages] = useState<WholesalePackage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [counts, setCounts] = useState({ products: 0, packages: 0 });

  const supplier = supplierId ? getSupplierById(supplierId) : undefined;
  const status = supplier?.approvalStatus ?? 'pending';
  const allowed = canListCatalog(status, supplier?.isActive);

  const myProducts = useMemo(
    () => products.filter((p) => p.supplierId === supplierId),
    [products, supplierId]
  );

  const productsById = useMemo(
    () => new Map(myProducts.map((p) => [p.id, p])),
    [myProducts]
  );

  const lowStock = useMemo(
    () => myProducts.filter((p) => p.stock <= 5 || p.status !== 'Active'),
    [myProducts]
  );

  useEffect(() => {
    return subscribePackages((next) => setPackages(next));
  }, []);

  useEffect(() => {
    if (!supplierId) {
      setOrdersLoading(false);
      return;
    }
    setOrdersLoading(true);
    return subscribeOrdersForSupplier(
      supplierId,
      (next) => {
        setOrders(next);
        setOrdersLoading(false);
      },
      () => setOrdersLoading(false)
    );
  }, [supplierId]);

  const myPackages = useMemo(
    () => packages.filter((p) => p.supplierId === supplierId),
    [packages, supplierId]
  );

  useEffect(() => {
    if (!supplierId) return;
    void getSupplierCatalogCounts(supplierId).then((c) =>
      setCounts({ products: c.products, packages: c.packages })
    );
  }, [supplierId, myProducts.length, myPackages.length]);

  const metrics = useMemo(() => {
    if (!supplierId) {
      return null;
    }
    return computeSupplierKeyMetrics(orders, supplierId, productsById);
  }, [orders, supplierId, productsById]);

  const monthlyTrend = useMemo(() => {
    if (!supplierId) return [];
    return computeSupplierMonthlyTrend(orders, supplierId, productsById);
  }, [orders, supplierId, productsById]);

  const topProducts = useMemo(() => {
    if (!supplierId) return [];
    return computeSupplierTopProducts(orders, supplierId, productsById);
  }, [orders, supplierId, productsById]);

  const categorySales = useMemo(() => {
    if (!supplierId) return [];
    return computeSupplierCategorySales(orders, supplierId, productsById);
  }, [orders, supplierId, productsById]);

  const orderFunnel = useMemo(() => computeOrderStatusFunnel(orders), [orders]);

  const loading = productsLoading || ordersLoading;

  return (
    <SupplierShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Performance"
          title="Insights"
          description={`Catalog analytics for ${supplier?.companyName || 'your store'}${
            supplier?.city ? ` · ${supplier.city}` : ''
          }.`}
          action={
            <>
              <ApprovedActionLink allowed={allowed} href="/suppliers/products/new">
                <Plus className="h-4 w-4" />
                Add product
              </ApprovedActionLink>
              <ApprovedActionLink allowed={allowed} href="/suppliers/packages/new" variant="outline">
                <Plus className="h-4 w-4" />
                Add package
              </ApprovedActionLink>
            </>
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !supplierId ? (
          <PartnerEmptyState
            icon={Package}
            title="Supplier profile required"
            description="Complete your supplier setup to unlock catalog insights."
          />
        ) : (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AnalyticsMetricCard
                title="Revenue this month"
                value={formatUGX(metrics?.thisMonthRevenue ?? 0)}
                change={metrics?.revenueChange}
                hint={`${formatUGX(metrics?.allTimeRevenue ?? 0)} all-time attributed`}
              />
              <AnalyticsMetricCard
                title="Orders this month"
                value={String(metrics?.thisMonthOrderCount ?? 0)}
                change={metrics?.ordersChange}
                hint={`${metrics?.unitsSoldThisMonth ?? 0} units sold`}
              />
              <AnalyticsMetricCard
                title="Avg order value"
                value={formatUGX(metrics?.averageOrderValue ?? 0)}
                change={metrics?.aovChange}
              />
              <AnalyticsMetricCard
                title="Payment success"
                value={`${(metrics?.paymentSuccessRate ?? 0).toFixed(1)}%`}
                hint={`${metrics?.allTimeOrders ?? 0} matched orders`}
              />
            </div>

            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PartnerStatCard
                label="Products"
                value={counts.products || myProducts.length}
                href="/suppliers/products"
                icon={Package}
              />
              <PartnerStatCard
                label="Packages"
                value={counts.packages || myPackages.length}
                href="/suppliers/packages"
                icon={Boxes}
              />
              <PartnerStatCard
                label="Orders"
                value={orders.length}
                href="/suppliers/orders"
                icon={ClipboardList}
              />
              <PartnerStatCard
                label="Low stock"
                value={lowStock.length}
                href="/suppliers/inventory"
                icon={Warehouse}
              />
            </div>

            {lowStock.length > 0 && (
              <section className="mb-8 rounded-xl border border-amber-200/70 bg-amber-50 p-4 text-amber-950">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {lowStock.length} item{lowStock.length === 1 ? '' : 's'} need inventory attention
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lowStock.slice(0, 4).map((product) => (
                    <Link
                      key={product.id}
                      href={`/suppliers/products/${product.id}/edit`}
                      className="rounded-lg bg-white/70 px-2.5 py-1 text-xs font-medium ring-1 ring-amber-200/80 hover:bg-white"
                    >
                      {product.name} · {product.stock} left
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="mb-6">
              <AnalyticsChartCard
                title="Revenue trend"
                description="Attributed line revenue from your catalog over the last 6 months"
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
                description="Status of orders that include your products"
              >
                <StatusFunnelBars items={orderFunnel} />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Sales by category"
                description="Where your catalog revenue is concentrated"
              >
                <SharePieChart
                  data={categorySales.map((c) => ({
                    name: c.category,
                    value: c.revenue,
                  }))}
                />
              </AnalyticsChartCard>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AnalyticsChartCard
                title="Top products"
                description="Best sellers by attributed revenue"
              >
                <RankedList
                  items={topProducts.map((p) => ({
                    id: p.productId,
                    title: p.name,
                    subtitle: `${p.units} units · ${p.orders} orders`,
                    value: formatUGX(p.revenue),
                  }))}
                  emptyMessage="Product sales will appear once customers order your items."
                />
              </AnalyticsChartCard>

              <section>
                <PartnerSectionLabel>Inventory watchlist</PartnerSectionLabel>
                <PartnerCard className="divide-y divide-border">
                  {myProducts.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Add products to track stock and sales.
                    </p>
                  ) : (
                    [...myProducts]
                      .sort((a, b) => a.stock - b.stock)
                      .slice(0, 6)
                      .map((product) => (
                        <Link
                          key={product.id}
                          href={`/suppliers/products/${product.id}/edit`}
                          className="flex items-center justify-between px-4 py-3.5 transition hover:bg-muted/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.sku} · {product.status}
                            </p>
                          </div>
                          <p
                            className={`shrink-0 text-sm font-semibold tabular-nums ${
                              product.stock <= 5 ? 'text-amber-700' : ''
                            }`}
                          >
                            {product.stock} in stock
                          </p>
                        </Link>
                      ))
                  )}
                </PartnerCard>
              </section>
            </div>
          </>
        )}
      </PartnerPage>
    </SupplierShell>
  );
}
