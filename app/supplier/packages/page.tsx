'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Boxes, Plus } from 'lucide-react';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useWholesale } from '@/lib/wholesale-context';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

export default function SupplierPackagesPage() {
  const { supplierId } = useAuth();
  const { packages, loading } = useWholesale();

  const mine = useMemo(
    () => packages.filter((p) => p.supplierId === supplierId),
    [packages, supplierId]
  );

  return (
    <SupplierShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Packages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${mine.length} package${mine.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link href="/supplier/packages/new" className={cn(buttonVariants(), 'gap-1.5')}>
          <Plus className="h-4 w-4" />
          Add package
        </Link>
      </div>

      {mine.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card px-6 py-14 text-center">
          <Boxes className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
          <h2 className="text-lg font-semibold">No packages yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Build bundles from your products. They go live after approval.
          </p>
          <Link
            href="/supplier/packages/new"
            className={cn(buttonVariants(), 'mt-4 inline-flex gap-1.5')}
          >
            <Plus className="h-4 w-4" />
            Add package
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {mine.map((pkg) => (
            <Link
              key={pkg.id}
              href={`/supplier/packages/${pkg.id}/edit`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 transition hover:border-primary/30"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{pkg.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pkg.items.length} items · {pkg.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">
                {formatUGX(pkg.discountedPrice ?? pkg.basePrice)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </SupplierShell>
  );
}
