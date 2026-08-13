'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Boxes, ClipboardList, Package, Plus, Warehouse } from 'lucide-react';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { ApprovedActionLink } from '@/components/partner/approved-action-link';
import {
  PartnerCard,
  PartnerPage,
  PartnerPageHeader,
  PartnerStatCard,
} from '@/components/partner/partner-page';
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

export default function SupplierDashboardPage() {
  const { supplierId } = useAuth();
  const { getSupplierById } = useSuppliers();
  const { products } = useProducts();
  const [packages, setPackages] = useState<WholesalePackage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState({ products: 0, packages: 0 });

  const supplier = supplierId ? getSupplierById(supplierId) : undefined;
  const status = supplier?.approvalStatus ?? 'pending';
  const allowed = canListCatalog(status, supplier?.isActive);

  const myProducts = useMemo(
    () => products.filter((p) => p.supplierId === supplierId),
    [products, supplierId]
  );

  const lowStock = useMemo(
    () => myProducts.filter((p) => p.stock <= 5 || p.status !== 'Active'),
    [myProducts]
  );

  useEffect(() => {
    return subscribePackages((next) => setPackages(next));
  }, []);

  useEffect(() => {
    if (!supplierId) return;
    return subscribeOrdersForSupplier(supplierId, setOrders);
  }, [supplierId]);

  const myPackages = useMemo(
    () => packages.filter((p) => p.supplierId === supplierId),
    [packages, supplierId]
  );

  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  useEffect(() => {
    if (!supplierId) return;
    void getSupplierCatalogCounts(supplierId).then((c) =>
      setCounts({ products: c.products, packages: c.packages })
    );
  }, [supplierId, myProducts.length, myPackages.length]);

  return (
    <SupplierShell>
      <PartnerPage>
        <PartnerPageHeader
          title="Insights"
          description={`Manage your catalog for ${supplier?.companyName || 'your store'}${
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

        <PartnerCard className="mb-8 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Catalog revenue (matched orders)
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatUGX(revenue)}</p>
        </PartnerCard>

        {lowStock.length > 0 && (
          <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <p className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {lowStock.length} item{lowStock.length === 1 ? '' : 's'} need inventory attention
            </p>
          </section>
        )}

        {myProducts.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent products
            </h2>
            <PartnerCard className="divide-y divide-[#E8E2D9]">
              {myProducts.slice(0, 5).map((product) => (
                <Link
                  key={product.id}
                  href={`/suppliers/products/${product.id}/edit`}
                  className="flex items-center justify-between px-4 py-3.5 transition hover:bg-white/70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatUGX(product.price)}
                  </p>
                </Link>
              ))}
            </PartnerCard>
          </section>
        )}
      </PartnerPage>
    </SupplierShell>
  );
}
