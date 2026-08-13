'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Boxes, Plus } from 'lucide-react';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import { ApprovedActionLink } from '@/components/partner/approved-action-link';
import {
  PartnerCard,
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
} from '@/components/partner/partner-page';
import { useAuth } from '@/lib/auth-context';
import { useWholesale } from '@/lib/wholesale-context';
import { useSuppliers } from '@/lib/suppliers-context';
import { canListCatalog } from '@/lib/partner-status';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

export default function SupplierPackagesPage() {
  const { supplierId } = useAuth();
  const { packages, loading } = useWholesale();
  const { getSupplierById } = useSuppliers();
  const supplier = supplierId ? getSupplierById(supplierId) : undefined;
  const allowed = canListCatalog(supplier?.approvalStatus, supplier?.isActive);

  const mine = useMemo(
    () => packages.filter((p) => p.supplierId === supplierId),
    [packages, supplierId]
  );

  return (
    <SupplierShell>
      <PartnerPage>
        <PartnerPageHeader
          title="Packages"
          description={loading ? 'Loading…' : `${mine.length} package${mine.length === 1 ? '' : 's'}`}
          action={
            <ApprovedActionLink allowed={allowed} href="/suppliers/packages/new">
              <Plus className="h-4 w-4" />
              Add package
            </ApprovedActionLink>
          }
        />

        {mine.length === 0 && !loading ? (
          <PartnerEmptyState
            icon={Boxes}
            title="No packages yet"
            description={
              allowed
                ? 'Build bundles from your products.'
                : 'Package listing unlocks after admin approval.'
            }
          />
        ) : (
          <PartnerCard className="divide-y divide-[#E8E2D9]">
            {mine.map((pkg) => (
              <Link
                key={pkg.id}
                href={`/suppliers/packages/${pkg.id}/edit`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-white/70"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground">{pkg.items.length} items</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      pkg.isActive
                        ? 'bg-emerald-500/15 text-emerald-800'
                        : 'bg-slate-500/15 text-slate-700'
                    )}
                  >
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <p className="font-semibold tabular-nums">
                    {formatUGX(pkg.discountedPrice ?? pkg.basePrice)}
                  </p>
                </div>
              </Link>
            ))}
          </PartnerCard>
        )}
      </PartnerPage>
    </SupplierShell>
  );
}
