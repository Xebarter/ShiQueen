'use client';

import { BarChart3, ShoppingCart, Users, TrendingUp, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminDashboard() {
  // Mock data - in production this would come from your database
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

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your store&apos;s performance overview.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{metric.title}</span>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-emerald-600 mt-1">{metric.change} from last month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest orders from your store</CardDescription>
                </div>
                <Link href="/admin/orders">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Order ID</th>
                      <th className="text-left py-3 px-4 font-medium">Customer</th>
                      <th className="text-left py-3 px-4 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border hover:bg-secondary transition">
                        <td className="py-3 px-4 font-medium">{order.id}</td>
                        <td className="py-3 px-4">{order.customer}</td>
                        <td className="py-3 px-4 font-semibold">{order.total}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-700'
                              : order.status === 'Shipped'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best sellers this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="pb-4 border-b border-border last:pb-0 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{index + 1}. {product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                      </div>
                      <span className="text-sm font-semibold">{product.revenue}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
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

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/products/new">
          <Button variant="outline" className="w-full">Add Product</Button>
        </Link>
        <Link href="/admin/orders">
          <Button variant="outline" className="w-full">Manage Orders</Button>
        </Link>
        <Link href="/admin/customers">
          <Button variant="outline" className="w-full">View Customers</Button>
        </Link>
        <Link href="/admin/settings">
          <Button variant="outline" className="w-full">Store Settings</Button>
        </Link>
      </div>
    </div>
  );
}
