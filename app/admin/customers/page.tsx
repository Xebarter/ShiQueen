'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Mail, MessageCircle, Trash2 } from 'lucide-react';

export default function AdminCustomers() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - international customers
  const customers = [
    {
      id: 1,
      name: 'Sarah Anderson',
      email: 'sarah@example.com',
      phone: '+1 (555) 123-4567',
      country: 'United States',
      orders: 5,
      totalSpent: '$1,249.95',
      lastOrder: '2024-01-15',
      tier: 'Gold',
    },
    {
      id: 2,
      name: 'Emma Wilson',
      email: 'emma@example.com',
      phone: '+1 (604) 234-5678',
      country: 'Canada',
      orders: 3,
      totalSpent: '$567.85',
      lastOrder: '2024-01-14',
      tier: 'Silver',
    },
    {
      id: 3,
      name: 'Jessica Chen',
      email: 'jessica@example.com',
      phone: '+44 20 7946 0958',
      country: 'United Kingdom',
      orders: 8,
      totalSpent: '$2,134.50',
      lastOrder: '2024-01-13',
      tier: 'Gold',
    },
    {
      id: 4,
      name: 'Sophie Martin',
      email: 'sophie@example.com',
      phone: '+33 1 42 68 53 00',
      country: 'France',
      orders: 2,
      totalSpent: '$345.99',
      lastOrder: '2024-01-12',
      tier: 'Bronze',
    },
    {
      id: 5,
      name: 'Anna Schmidt',
      email: 'anna@example.com',
      phone: '+49 30 12345678',
      country: 'Germany',
      orders: 4,
      totalSpent: '$876.45',
      lastOrder: '2024-01-11',
      tier: 'Silver',
    },
    {
      id: 6,
      name: 'Yuki Tanaka',
      email: 'yuki@example.com',
      phone: '+81 3-1234-5678',
      country: 'Japan',
      orders: 6,
      totalSpent: '$1,654.30',
      lastOrder: '2024-01-10',
      tier: 'Gold',
    },
    {
      id: 7,
      name: 'Maria Garcia',
      email: 'maria@example.com',
      phone: '+34 91 123 4567',
      country: 'Spain',
      orders: 1,
      totalSpent: '$89.99',
      lastOrder: '2024-01-09',
      tier: 'Bronze',
    },
  ];

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Gold':
        return 'bg-amber-100 text-amber-700';
      case 'Silver':
        return 'bg-slate-100 text-slate-700';
      case 'Bronze':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-muted-foreground mt-1">Manage your customer database and loyalty program</p>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Customer Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">{customer.country}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(customer.tier)}`}>
                      {customer.tier} Member
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                      <p className="text-lg font-semibold">{customer.orders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                      <p className="text-lg font-semibold">{customer.totalSpent}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">{customer.email}</span>
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">{customer.phone}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Last order: {customer.lastOrder}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 md:w-24">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="hidden md:inline">Email</span>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden md:inline">Message</span>
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 gap-2">
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden md:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-muted-foreground">No customers found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
