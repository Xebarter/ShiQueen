'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Edit, Loader2, Package as PackageIcon, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import {
  PackageActiveBadge,
  packageRuleLabel,
  StatCard,
} from '@/components/admin/admin-wholesale-shared';
import { PackageCoverDisplay } from '@/components/packages/package-cover-display';
import { useProducts } from '@/lib/products-context';
import { useWholesale } from '@/lib/wholesale-context';
import { useServices } from '@/lib/services-context';
import { getPackageCoverImages } from '@/lib/package-utils';
import {
  PACKAGE_CATEGORIES,
  getPackageCategoryLabel,
} from '@/lib/package-catalog';
import { formatUGX } from '@/lib/wholesale-data';
import type { Product } from '@/lib/types/database';
import type { ServiceListing } from '@/lib/types/services';
import type { Package } from '@/lib/types/wholesale';

function AdminPackageCoverThumb({
  pkg,
  products,
  services,
}: {
  pkg: Package;
  products: Product[];
  services: ServiceListing[];
}) {
  const coverImages = getPackageCoverImages(pkg, products, services);

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted">
      <PackageCoverDisplay
        images={coverImages}
        alt={pkg.name}
        sizes="56px"
        fallbackClassName="text-lg"
      />
    </div>
  );
}

export function AdminWholesalePackagesPage() {
  const { packages, deletePackage, loading } = useWholesale();
  const { products } = useProducts();
  const { activeListings } = useServices();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredPackages = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return packages.filter((pkg) => {
      if (categoryFilter !== 'all' && pkg.category !== categoryFilter) return false;
      if (!term) return true;
      return (
        pkg.name.toLowerCase().includes(term) ||
        pkg.description.toLowerCase().includes(term) ||
        (pkg.tagline ?? '').toLowerCase().includes(term) ||
        getPackageCategoryLabel(pkg.category).toLowerCase().includes(term) ||
        packageRuleLabel(pkg.rule).toLowerCase().includes(term)
      );
    });
  }, [packages, searchTerm, categoryFilter]);

  const stats = useMemo(
    () => ({
      total: packages.length,
      active: packages.filter((p) => p.isActive).length,
      inactive: packages.filter((p) => !p.isActive).length,
      signature: packages.filter((p) => p.isSignature && p.isActive).length,
    }),
    [packages]
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deletePackage(id);
      toast.success('Package deleted');
    } catch {
      toast.error('Failed to delete package');
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Curated bundles"
        description="Manage complete solutions for needs, occasions, and gifts"
        action={
          <Link href="/admin/packages/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create package
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {packages.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total" value={stats.total} icon={PackageIcon} accent="text-foreground" />
              <StatCard label="Active" value={stats.active} icon={PackageIcon} accent="text-emerald-600" />
              <StatCard label="Inactive" value={stats.inactive} icon={PackageIcon} accent="text-slate-500" />
              <StatCard label="Signature" value={stats.signature} icon={PackageIcon} accent="text-primary" />
            </div>
          )}

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg font-light tracking-tight">All packages</CardTitle>
                  <CardDescription>
                    {filteredPackages.length} of {packages.length} packages
                  </CardDescription>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row md:max-w-xl">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All categories</option>
                    {PACKAGE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder="Search bundles…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {packages.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <PackageIcon className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold">No packages yet</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Create your first curated bundle — a complete solution customers can buy in one order.
                  </p>
                  <Link href="/admin/packages/new">
                    <Button className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Create package
                    </Button>
                  </Link>
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-muted-foreground">No packages match your search.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchTerm('')}>
                    Clear search
                  </Button>
                </div>
              ) : (
                <>
                  <div className="md:hidden">
                    {filteredPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0"
                      >
                        <AdminPackageCoverThumb
                          pkg={pkg}
                          products={products}
                          services={activeListings}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium">{pkg.name}</p>
                            <PackageActiveBadge isActive={pkg.isActive} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {getPackageCategoryLabel(pkg.category)} · {pkg.items.length} items
                          </p>
                          {pkg.tagline && (
                            <p className="line-clamp-1 text-xs text-muted-foreground">{pkg.tagline}</p>
                          )}
                          <p className="mt-1 text-sm font-semibold tabular-nums">
                            {formatUGX(pkg.discountedPrice)}
                            <span className="ml-2 text-xs font-medium text-emerald-600">
                              −{pkg.savingsPercentage.toFixed(1)}%
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Link href={`/admin/packages/${pkg.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Edit package">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            aria-label="Delete package"
                            onClick={() => handleDelete(pkg.id, pkg.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[800px] text-sm">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/30">
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Package
                          </th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Category
                          </th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Items
                          </th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Retail
                          </th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Price
                          </th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Status
                          </th>
                          <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPackages.map((pkg) => (
                          <tr
                            key={pkg.id}
                            className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <AdminPackageCoverThumb
                          pkg={pkg}
                          products={products}
                          services={activeListings}
                        />
                                <div className="min-w-0">
                                  <p className="font-medium">{pkg.name}</p>
                                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                    {pkg.tagline || pkg.description}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                                {getPackageCategoryLabel(pkg.category)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 tabular-nums">{pkg.items.length}</td>
                            <td className="px-5 py-3.5 text-muted-foreground line-through tabular-nums">
                              {formatUGX(pkg.basePrice)}
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="font-semibold tabular-nums">{formatUGX(pkg.discountedPrice)}</p>
                              <p className="text-xs text-emerald-600">
                                −{pkg.savingsPercentage.toFixed(1)}%
                              </p>
                            </td>
                            <td className="px-5 py-3.5">
                              <PackageActiveBadge isActive={pkg.isActive} />
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex justify-end gap-1">
                                <Link href={`/admin/packages/${pkg.id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  aria-label="Delete package"
                                  onClick={() => handleDelete(pkg.id, pkg.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AdminPage>
  );
}
