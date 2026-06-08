'use client';

import { ShoppingCart, Users, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const metrics = [
    {
      title: 'Total Revenue',
      value: 'USh 170,000,000',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-emerald-600',
    },
    {
      title: 'Total Orders',
      value: '1,254',
      change: '+8.2%',
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Active Customers',
      value: '3,821',
      change: '+5.1%',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Products in Stock',
      value: '847',
      change: '-2.3%',
      icon: Package,
      color: 'text-amber-600',
    },
  ];

  const recentOrders = [
    { id: 'ORD-001', customer: 'Sarah Anderson', total: 'USh 1,200,000', status: 'Shipped', date: '2024-01-15' },
    { id: 'ORD-002', customer: 'Emma Wilson', total: 'USh 750,000', status: 'Processing', date: '2024-01-15' },
    { id: 'ORD-003', customer: 'Jessica Chen', total: 'USh 350,000', status: 'Delivered', date: '2024-01-14' },
    { id: 'ORD-004', customer: 'Maya Patel', total: 'USh 1,600,000', status: 'Shipped', date: '2024-01-14' },
    { id: 'ORD-005', customer: 'Lisa Thompson', total: 'USh 450,000', status: 'Processing', date: '2024-01-13' },
  ];

  const topProducts = [
    { id: 1, name: 'Premium Silk Blouse', sales: 342, revenue: 'USh 30,000,000' },
    { id: 2, name: 'Organic Skincare Set', sales: 289, revenue: 'USh 23,000,000' },
    { id: 3, name: 'Luxury Yoga Mat', sales: 267, revenue: 'USh 18,700,000' },
    { id: 4, name: 'Cashmere Sweater', sales: 198, revenue: 'USh 27,700,000' },
    { id: 5, name: 'Crystal Water Bottle', sales: 156, revenue: 'USh 8,200,000' },
  ];

  const statusClass = (status: string) => {
    if (status === 'Delivered') return 'bg-emerald-100 text-emerald-700';
    if (status === 'Shipped') return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Dashboard"
        description="Welcome back! Here's your store's performance overview."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <span>{metric.title}</span>
                  <Icon className={cn('h-5 w-5', metric.color)} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold sm:text-2xl">{metric.value}</div>
                <p className="mt-1 text-xs text-emerald-600">{metric.change} from last month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest orders from your store</CardDescription>
                </div>
                <Link href="/admin/orders">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    View all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border/70 bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-primary">{order.id}</p>
                        <p className="mt-0.5 truncate text-sm">{order.customer}</p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded px-2 py-1 text-xs font-medium',
                          statusClass(order.status)
                        )}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="font-semibold">{order.total}</span>
                      <span className="text-muted-foreground">{order.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium">Order ID</th>
                      <th className="px-4 py-3 text-left font-medium">Customer</th>
                      <th className="px-4 py-3 text-left font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border transition hover:bg-secondary">
                        <td className="px-4 py-3 font-medium">{order.id}</td>
                        <td className="px-4 py-3">{order.customer}</td>
                        <td className="px-4 py-3 font-semibold">{order.total}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'rounded px-2 py-1 text-xs font-medium',
                              statusClass(order.status)
                            )}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best sellers this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {index + 1}. {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">{product.revenue}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${(product.sales / 342) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:mt-8">
        <Link href="/admin/products/new">
          <Button variant="outline" className="min-h-11 w-full">
            Add product
          </Button>
        </Link>
        <Link href="/admin/orders">
          <Button variant="outline" className="min-h-11 w-full">
            Manage orders
          </Button>
        </Link>
        <Link href="/admin/customers">
          <Button variant="outline" className="min-h-11 w-full">
            View customers
          </Button>
        </Link>
        <Link href="/admin/settings">
          <Button variant="outline" className="min-h-11 w-full">
            Store settings
          </Button>
        </Link>
      </div>
    </AdminPage>
  );
}
