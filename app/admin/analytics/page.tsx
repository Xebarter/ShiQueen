'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Globe, ShoppingCart } from 'lucide-react';

export default function AdminAnalytics() {
  const metrics = [
    {
      title: 'Monthly Revenue',
      value: '$48,532.89',
      change: '+12.5%',
      trend: 'up',
      icon: TrendingUp,
    },
    {
      title: 'Conversion Rate',
      value: '3.24%',
      change: '+0.5%',
      trend: 'up',
      icon: TrendingUp,
    },
    {
      title: 'Average Order Value',
      value: '$156.78',
      change: '-2.1%',
      trend: 'down',
      icon: TrendingDown,
    },
    {
      title: 'Repeat Customer Rate',
      value: '42.5%',
      change: '+4.2%',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  const topCountries = [
    { country: 'United States', orders: 342, revenue: '$12,456.00', growth: '+15%' },
    { country: 'United Kingdom', orders: 156, revenue: '$5,678.00', growth: '+8%' },
    { country: 'Canada', orders: 124, revenue: '$4,523.00', growth: '+12%' },
    { country: 'Germany', orders: 98, revenue: '$3,456.00', growth: '+5%' },
    { country: 'France', orders: 87, revenue: '$3,234.00', growth: '+3%' },
    { country: 'Australia', orders: 76, revenue: '$2,890.00', growth: '+18%' },
    { country: 'Japan', orders: 65, revenue: '$2,456.00', growth: '+7%' },
    { country: 'Spain', orders: 54, revenue: '$1,876.00', growth: '+2%' },
  ];

  const salesByCategory = [
    { category: 'Clothing', sales: 1243, percentage: 42, revenue: '$20,350.00' },
    { category: 'Beauty', sales: 856, percentage: 29, revenue: '$14,890.00' },
    { category: 'Wellness', sales: 534, percentage: 18, revenue: '$9,234.00' },
    { category: 'Accessories', sales: 298, percentage: 11, revenue: '$4,058.00' },
  ];

  const monthlyTrend = [
    { month: 'Jan', revenue: '$28,500', orders: 245, customers: 189 },
    { month: 'Feb', revenue: '$32,100', orders: 267, customers: 201 },
    { month: 'Mar', revenue: '$41,200', orders: 318, customers: 245 },
    { month: 'Apr', revenue: '$48,532', orders: 389, customers: 298 },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Performance metrics and insights for your international store</p>
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
                  <Icon className={`w-5 h-5 ${metric.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className={`text-xs mt-1 ${metric.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Top Markets by Country
            </CardTitle>
            <CardDescription>Revenue and orders by international region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCountries.map((item, index) => (
                <div key={item.country} className="pb-4 border-b border-border last:pb-0 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{index + 1}. {item.country}</p>
                      <p className="text-xs text-muted-foreground">{item.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.revenue}</p>
                      <p className="text-xs text-emerald-600">{item.growth}</p>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${(item.orders / 342) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Sales by Category
            </CardTitle>
            <CardDescription>Product category performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesByCategory.map((item) => (
                <div key={item.category} className="pb-4 border-b border-border last:pb-0 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{item.category}</p>
                      <p className="text-xs text-muted-foreground">{item.sales} sales</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.revenue}</p>
                      <p className="text-xs text-primary font-medium">{item.percentage}% of total</p>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-accent rounded-full h-2"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
          <CardDescription>Revenue, orders, and customer growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Month</th>
                  <th className="text-left py-3 px-4 font-medium">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium">Orders</th>
                  <th className="text-left py-3 px-4 font-medium">New Customers</th>
                  <th className="text-left py-3 px-4 font-medium">Avg Order Value</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((item) => (
                  <tr key={item.month} className="border-b border-border hover:bg-secondary transition">
                    <td className="py-3 px-4 font-medium">{item.month}</td>
                    <td className="py-3 px-4 font-semibold">{item.revenue}</td>
                    <td className="py-3 px-4">{item.orders}</td>
                    <td className="py-3 px-4">{item.customers}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      ${(parseInt(item.revenue.replace(/[$,]/g, '')) / item.orders).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
