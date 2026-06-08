'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Edit, Loader2, Package, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import {
  AdminWholesaleBackLink,
  PackageActiveBadge,
  packageRuleLabel,
  StatCard,
} from '@/components/admin/admin-wholesale-shared';
import { useWholesale } from '@/lib/wholesale-context';
import { formatUGX } from '@/lib/wholesale-data';

export function AdminWholesalePackagesPage() {
  const { packages, deletePackage, loading } = useWholesale();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPackages = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return packages;
    return packages.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(term) ||
        pkg.description.toLowerCase().includes(term) ||
        packageRuleLabel(pkg.rule).toLowerCase().includes(term)
    );
  }, [packages, searchTerm]);

  const stats = useMemo(
    () => ({
      total: packages.length,
      active: packages.filter((p) => p.isActive).length,
      inactive: packages.filter((p) => !p.isActive).length,
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
      <AdminWholesaleBackLink href="/admin/wholesale" label="Back to wholesale" />

      <AdminPageHeader
        title="Packages"
        description="Create and manage wholesale bundles"
        action={
          <Link href="/admin/wholesale/packages/new">
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
            <div className="mb-6 grid grid-cols-3 gap-3">
              <StatCard label="Total" value={stats.total} icon={Package} accent="text-foreground" />
              <StatCard label="Active" value={stats.active} icon={Package} accent="text-emerald-600" />
              <StatCard label="Inactive" value={stats.inactive} icon={Package} accent="text-slate-500" />
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
                <div className="relative w-full md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search packages…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {packages.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <Package className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold">No packages yet</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Create your first wholesale bundle to offer bulk pricing.
                  </p>
                  <Link href="/admin/wholesale/packages/new">
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
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium">{pkg.name}</p>
                            <PackageActiveBadge isActive={pkg.isActive} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {pkg.items.length} items · {packageRuleLabel(pkg.rule)}
                          </p>
                          <p className="mt-1 text-sm font-semibold tabular-nums">
                            {formatUGX(pkg.discountedPrice)}
                            <span className="ml-2 text-xs font-medium text-emerald-600">
                              −{pkg.savingsPercentage.toFixed(1)}%
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Link href={`/admin/wholesale/packages/${pkg.id}`}>
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
                            Type
                          </th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Items
                          </th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Retail
                          </th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Wholesale
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
                              <p className="font-medium">{pkg.name}</p>
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                {pkg.description}
                              </p>
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground">
                              {packageRuleLabel(pkg.rule)}
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
                                <Link href={`/admin/wholesale/packages/${pkg.id}`}>
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
