'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Plus } from 'lucide-react';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { buttonVariants } from '@/components/ui/button';
import { isRemoteProductImage } from '@/components/product-image';
import { useAuth } from '@/lib/auth-context';
import { useProducts } from '@/lib/products-context';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

export default function SupplierProductsPage() {
  const { supplierId } = useAuth();
  const { products, loading } = useProducts();

  const mine = useMemo(
    () => products.filter((p) => p.supplierId === supplierId),
    [products, supplierId]
  );

  return (
    <SupplierShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${mine.length} product${mine.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link href="/supplier/products/new" className={cn(buttonVariants(), 'gap-1.5')}>
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </div>

      {mine.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card px-6 py-14 text-center">
          <Package className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
          <h2 className="text-lg font-semibold">No products yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Add your first product. It will appear on the storefront after your account is approved.
          </p>
          <Link
            href="/supplier/products/new"
            className={cn(buttonVariants(), 'mt-4 inline-flex gap-1.5')}
          >
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {mine.map((product) => (
            <Link
              key={product.id}
              href={`/supplier/products/${product.id}/edit`}
              className="flex gap-3 rounded-xl border border-border/70 bg-card p-3 transition hover:border-primary/30 sm:p-4"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {isRemoteProductImage(product.image) ? (
                  <Image
                    src={product.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
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
                      {product.sku} · {product.category} · {product.status}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">
                    {formatUGX(product.price)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Stock {product.stock}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SupplierShell>
  );
}
