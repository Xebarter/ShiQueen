'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Plus } from 'lucide-react';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { ApprovedActionLink } from '@/components/partner/approved-action-link';
import {
  PartnerCard,
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
} from '@/components/partner/partner-page';
import { isRemoteProductImage } from '@/components/product-image';
import { useAuth } from '@/lib/auth-context';
import { useProducts } from '@/lib/products-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { canListCatalog } from '@/lib/partner-status';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

export default function SupplierProductsPage() {
  const { supplierId } = useAuth();
  const { products, loading } = useProducts();
  const { getSupplierById } = useSuppliers();
  const supplier = supplierId ? getSupplierById(supplierId) : undefined;
  const allowed = canListCatalog(supplier?.approvalStatus, supplier?.isActive);

  const mine = useMemo(
    () => products.filter((p) => p.supplierId === supplierId),
    [products, supplierId]
  );

  return (
    <SupplierShell>
      <PartnerPage>
        <PartnerPageHeader
          title="Products"
          description={loading ? 'Loading…' : `${mine.length} product${mine.length === 1 ? '' : 's'}`}
          action={
            <ApprovedActionLink allowed={allowed} href="/suppliers/products/new">
              <Plus className="h-4 w-4" />
              Add product
            </ApprovedActionLink>
          }
        />

        {mine.length === 0 && !loading ? (
          <PartnerEmptyState
            icon={Package}
            title="No products yet"
            description={
              allowed
                ? 'Add your first product. It appears on the storefront when active.'
                : 'You can add products after an admin approves your account.'
            }
          />
        ) : (
          <PartnerCard className="divide-y divide-border">
            {mine.map((product) => (
              <Link
                key={product.id}
                href={`/suppliers/products/${product.id}/edit`}
                className="flex gap-3 p-3 transition hover:bg-muted/40 sm:p-4"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {isRemoteProductImage(product.image) ? (
                    <Image src={product.image} alt="" fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku} · {product.category}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{formatUGX(product.price)}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        product.status === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-800'
                          : 'bg-slate-500/15 text-slate-700'
                      )}
                    >
                      {product.status}
                    </span>
                    <p className="text-xs text-muted-foreground">Stock {product.stock}</p>
                  </div>
                </div>
              </Link>
            ))}
          </PartnerCard>
        )}
      </PartnerPage>
    </SupplierShell>
  );
}
