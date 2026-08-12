'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Boxes, Package, Plus } from 'lucide-react';
import { SupplierShell, SUPPLIER_STATUS_META } from '@/components/supplier/supplier-shell';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useProducts } from '@/lib/products-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { getSupplierCatalogCounts } from '@/lib/firebase/suppliers';
import { subscribePackages } from '@/lib/firebase/wholesale';
import type { Package as WholesalePackage } from '@/lib/types/wholesale';
import { cn } from '@/lib/utils';
import { formatUGX } from '@/lib/wholesale-data';

export default function SupplierDashboardPage() {
  const { supplierId } = useAuth();
  const { getSupplierById } = useSuppliers();
  const { products } = useProducts();
  const [packages, setPackages] = useState<WholesalePackage[]>([]);
  const [counts, setCounts] = useState({ products: 0, packages: 0 });

  const supplier = supplierId ? getSupplierById(supplierId) : undefined;
  const status = supplier?.approvalStatus ?? 'pending';
  const statusMeta = SUPPLIER_STATUS_META[status];

  const myProducts = useMemo(
    () => products.filter((p) => p.supplierId === supplierId),
    [products, supplierId]
  );

  useEffect(() => {
    return subscribePackages((next) => setPackages(next));
  }, []);

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

  return (
    <SupplierShell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your catalog for {supplier?.companyName || 'your store'}.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
            statusMeta.className
          )}
        >
          {statusMeta.label}
        </span>
        {supplier?.city && (
          <span className="text-xs text-muted-foreground">{supplier.city}</span>
        )}
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Products
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {counts.products || myProducts.length}
              </p>
            </div>
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <Link
            href="/supplier/products"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Manage products →
          </Link>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Packages
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {counts.packages || myPackages.length}
              </p>
            </div>
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Boxes className="h-4 w-4" />
            </span>
          </div>
          <Link
            href="/supplier/packages"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Manage packages →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/supplier/products/new"
          className={cn(buttonVariants(), 'gap-1.5')}
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
        <Link
          href="/supplier/packages/new"
          className={cn(buttonVariants({ variant: 'outline' }), 'gap-1.5')}
        >
          <Plus className="h-4 w-4" />
          Add package
        </Link>
      </div>

      {myProducts.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent products
          </h2>
          <div className="space-y-2">
            {myProducts.slice(0, 5).map((product) => (
              <Link
                key={product.id}
                href={`/supplier/products/${product.id}/edit`}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 transition hover:border-primary/30"
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
          </div>
        </section>
      )}
    </SupplierShell>
  );
}
