'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Building2,
  Edit,
  Loader2,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { useWholesale } from '@/lib/wholesale-context';
import { formatUGX } from '@/lib/wholesale-data';
import {
  BulkOrderStatusBadge,
  formatWholesaleDate,
  formatWholesaleRef,
  PackageActiveBadge,
  packageRuleLabel,
  QuickNavCard,
  StatCard,
} from '@/components/admin/admin-wholesale-shared';

export function AdminWholesalePage() {
  const { packages, bulkOrders, wholesaleAccounts, deletePackage, loading } = useWholesale();

  const stats = useMemo(() => {
    const activePackages = packages.filter((p) => p.isActive);
    const activeOrders = bulkOrders.filter((o) => o.status !== 'cancelled');
    const pendingOrders = bulkOrders.filter((o) => o.status === 'pending' || o.status === 'draft');
    const pendingAccounts = wholesaleAccounts.filter((a) => a.status === 'pending');

    return {
      activePackages: activePackages.length,
      bulkOrders: bulkOrders.length,
      pendingOrders: pendingOrders.length,
      revenue: activeOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      bundleSavings: packages.reduce((sum, pkg) => sum + (pkg.basePrice - pkg.discountedPrice), 0),
      pendingAccounts: pendingAccounts.length,
    };
  }, [packages, bulkOrders, wholesaleAccounts]);

  const recentOrders = bulkOrders.slice(0, 5);

  const handleDeletePackage = async (id: string, name: string) => {
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
        title="Wholesale"
        description="Packages, bulk orders, and B2B accounts"
        action={
          <Link href="/admin/packages/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New package
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
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard
              label="Active packages"
              value={stats.activePackages}
              icon={Package}
              accent="text-foreground"
            />
            <StatCard
              label="Bulk orders"
              value={stats.bulkOrders}
              icon={ShoppingCart}
              accent="text-violet-600"
            />
            <StatCard
              label="Pending review"
              value={stats.pendingOrders}
              icon={Users}
              accent="text-amber-600"
            />
            <StatCard
              label="Revenue"
              value={formatUGX(stats.revenue)}
              icon={TrendingUp}
              accent="text-emerald-600"
            />
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <QuickNavCard
              href="/admin/packages"
              title="Packages"
              description="Create and edit wholesale bundles"
              icon={Package}
              badge={packages.length}
            />
            <QuickNavCard
              href="/admin/wholesale/orders"
              title="Bulk orders"
              description="Review and fulfil wholesale orders"
              icon={ShoppingCart}
              badge={bulkOrders.length}
            />
            <QuickNavCard
              href="/admin/wholesale/settings"
              title="Settings"
              description="Pricing tiers and account applications"
              icon={Settings}
              badge={stats.pendingAccounts > 0 ? stats.pendingAccounts : undefined}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="overflow-hidden border-border/70 shadow-sm lg:col-span-2">
              <CardHeader className="border-b border-border/60 bg-muted/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-light tracking-tight">
                      Packages & bundles
                    </CardTitle>
                    <CardDescription>
                      {packages.length === 0
                        ? 'No packages yet'
                        : `${packages.length} package${packages.length === 1 ? '' : 's'} in catalogue`}
                    </CardDescription>
                  </div>
                  <Link href="/admin/packages">
                    <Button variant="outline" size="sm">
                      View all
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {packages.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Package className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
                    <h3 className="text-lg font-semibold">No packages yet</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                      Create your first wholesale bundle to start selling in bulk.
                    </p>
                    <Link href="/admin/packages/new">
                      <Button className="mt-4 gap-2">
                        <Plus className="h-4 w-4" />
                        Create package
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="md:hidden">
                      {packages.map((pkg) => (
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
                            <Link href={`/admin/packages/${pkg.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0"
                                aria-label={`Edit ${pkg.name}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 text-red-600 hover:text-red-700"
                              aria-label={`Delete ${pkg.name}`}
                              onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[640px] text-sm">
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
                          {packages.map((pkg) => (
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
                              <td className="px-5 py-3.5">
                                <p className="font-semibold tabular-nums">
                                  {formatUGX(pkg.discountedPrice)}
                                </p>
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
                                    aria-label={`Delete ${pkg.name}`}
                                    onClick={() => handleDeletePackage(pkg.id, pkg.name)}
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

            <div className="space-y-6">
              <Card className="border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Bundle savings
                  </CardTitle>
                  <CardDescription>Total discount value across all packages</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums text-emerald-600">
                    {formatUGX(stats.bundleSavings)}
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-border/70 shadow-sm">
                <CardHeader className="border-b border-border/60 bg-muted/10 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold">Recent bulk orders</CardTitle>
                    <Link href="/admin/wholesale/orders">
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        View all
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {bulkOrders.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No bulk orders yet
                    </p>
                  ) : (
                    <div>
                      {recentOrders.map((order) => (
                        <Link
                          key={order.id}
                          href={`/admin/wholesale/orders/${order.id}`}
                          className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0 hover:bg-muted/30"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-sm font-semibold text-primary">
                              {formatWholesaleRef(order.id)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatWholesaleDate(order.requestedAt)}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold tabular-nums">
                              {formatUGX(order.totalAmount)}
                            </p>
                            <div className="mt-1 flex justify-end">
                              <BulkOrderStatusBadge status={order.status} />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {stats.pendingAccounts > 0 && (
                <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
                  <CardContent className="flex items-start gap-3 p-4">
                    <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">
                        {stats.pendingAccounts} account application
                        {stats.pendingAccounts === 1 ? '' : 's'} pending
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Review wholesale account requests in settings.
                      </p>
                      <Link href="/admin/wholesale/settings">
                        <Button variant="outline" size="sm" className="mt-3">
                          Review applications
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </AdminPage>
  );
}
