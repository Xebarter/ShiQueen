'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Warehouse } from 'lucide-react';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import {
  PartnerCard,
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
} from '@/components/partner/partner-page';
import { useAuth } from '@/lib/auth-context';
import { useProducts } from '@/lib/products-context';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

export default function SupplierInventoryPage() {
  const { supplierId } = useAuth();
  const { products, loading } = useProducts();

  const mine = useMemo(
    () => products.filter((p) => p.supplierId === supplierId),
    [products, supplierId]
  );

  return (
    <SupplierShell>
      <PartnerPage>
        <PartnerPageHeader
          title="Inventory"
          description="Stock levels across your catalog. Items with 5 or fewer units are flagged."
        />

        {mine.length === 0 && !loading ? (
          <PartnerEmptyState
            icon={Warehouse}
            title="No inventory yet"
            description="Add products to start tracking stock."
          />
        ) : (
          <PartnerCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#E8E2D9] bg-[#FBF8F4] text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((product) => (
                    <tr key={product.id} className="border-b border-[#E8E2D9] last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/suppliers/products/${product.id}/edit`}
                          className="font-medium hover:text-primary"
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{product.sku}</td>
                      <td
                        className={cn(
                          'px-4 py-3 tabular-nums',
                          product.stock <= 5 && 'font-semibold text-amber-700'
                        )}
                      >
                        {product.stock}
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatUGX(product.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PartnerCard>
        )}
      </PartnerPage>
    </SupplierShell>
  );
}
