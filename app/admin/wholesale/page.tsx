'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWholesale } from '@/lib/wholesale-context';
import { formatUGX } from '@/lib/wholesale-data';
import { BarChart3, Package, TrendingUp, Plus, ShoppingCart, Settings } from 'lucide-react';

export default function AdminWholesalePage() {
  const { packages, bulkOrders } = useWholesale();

  const activePackages = packages.filter((p) => p.isActive);
  const wholesaleRevenue = bulkOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const bundleSavings = packages.reduce(
    (sum, pkg) => sum + (pkg.basePrice - pkg.discountedPrice),
    0
  );

  const metrics = [
    {
      title: 'Active Packages',
      value: activePackages.length,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Bulk Orders',
      value: bulkOrders.length,
      icon: ShoppingCart,
      color: 'text-emerald-600',
    },
    {
      title: 'Wholesale Revenue',
      value: formatUGX(wholesaleRevenue),
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: 'Bundle Savings Generated',
      value: formatUGX(bundleSavings),
      icon: BarChart3,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Wholesale Management</h1>
          <p className="text-muted-foreground">
            Manage wholesale operations, packages, and bulk orders
          </p>
        </div>
        <Link href="/admin/wholesale/packages/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Package
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${metric.color} opacity-70`} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Packages & Bundles</h2>
              <Link href="/admin/wholesale/packages">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {packages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No packages created yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {packages.slice(0, 5).map((pkg) => (
                  <Link
                    key={pkg.id}
                    href={`/admin/wholesale/packages/${pkg.id}`}
                    className="block p-4 border border-border rounded-lg hover:bg-secondary/50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{pkg.name}</h3>
                        <p className="text-sm text-muted-foreground">{pkg.items.length} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatUGX(pkg.discountedPrice)}</p>
                        <p className="text-sm text-accent font-medium">
                          Save {pkg.savingsPercentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/admin/wholesale/packages">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  Manage Packages
                </Button>
              </Link>
              <Link href="/admin/wholesale/orders">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Orders ({bulkOrders.length})
                </Button>
              </Link>
              <Link href="/admin/wholesale/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Wholesale Settings
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Recent Bulk Orders</h2>
            {bulkOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bulk orders yet</p>
            ) : (
              <div className="space-y-2 text-sm">
                {bulkOrders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/wholesale/orders/${order.id}`}
                    className="block p-2 rounded hover:bg-secondary"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{order.id}</span>
                      <span className="text-muted-foreground">{formatUGX(order.totalAmount)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{order.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
