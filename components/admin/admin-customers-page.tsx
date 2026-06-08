'use client';

import { useMemo, useState } from 'react';
import {
  Crown,
  Mail,
  MessageCircle,
  Search,
  Trash2,
  Users,
  UserCheck,
  ShoppingBag,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { getEmailInitial, getAvatarColorsForLetter } from '@/lib/user-display';
import { cn } from '@/lib/utils';

type CustomerTier = 'Gold' | 'Silver' | 'Bronze';

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  orders: number;
  totalSpent: string;
  lastOrder: string;
  tier: CustomerTier;
};

const CUSTOMERS: Customer[] = [
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

function tierConfig(tier: CustomerTier) {
  switch (tier) {
    case 'Gold':
      return { label: 'Gold', className: 'bg-amber-500/10 text-amber-700 ring-amber-500/20' };
    case 'Silver':
      return { label: 'Silver', className: 'bg-slate-500/10 text-slate-700 ring-slate-500/20' };
    default:
      return { label: 'Bronze', className: 'bg-orange-500/10 text-orange-700 ring-orange-500/20' };
  }
}

function TierBadge({ tier }: { tier: CustomerTier }) {
  const config = tierConfig(tier);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function CustomerAvatar({ name, email }: { name: string; email: string }) {
  const initial = getEmailInitial(email) || name.charAt(0).toUpperCase();
  const colors = getAvatarColorsForLetter(initial);
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: colors.background }}
    >
      {initial}
    </span>
  );
}

function CustomerActions({ compact }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-1', compact ? 'shrink-0' : 'justify-end')}>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Email customer">
        <Mail className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Message customer">
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        aria-label="Delete customer"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold tabular-nums', accent)}>{value}</p>
        </div>
        <span className={cn('rounded-lg bg-muted p-2', accent)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function MobileCustomerRow({ customer }: { customer: Customer }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0">
      <CustomerAvatar name={customer.name} email={customer.email} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{customer.name}</p>
          <TierBadge tier={customer.tier} />
        </div>
        <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold">{customer.totalSpent}</p>
        <p className="text-[11px] text-muted-foreground">{customer.orders} orders</p>
      </div>
      <CustomerActions compact />
    </div>
  );
}

function DesktopCustomerRow({ customer }: { customer: Customer }) {
  return (
    <tr className="group border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <CustomerAvatar name={customer.name} email={customer.email} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{customer.name}</p>
            <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-muted-foreground">{customer.country}</td>
      <td className="px-5 py-3.5">
        <TierBadge tier={customer.tier} />
      </td>
      <td className="px-5 py-3.5 text-sm font-semibold tabular-nums">{customer.orders}</td>
      <td className="px-5 py-3.5 text-sm font-semibold">{customer.totalSpent}</td>
      <td className="px-5 py-3.5 text-sm text-muted-foreground">{customer.lastOrder}</td>
      <td className="px-5 py-3.5">
        <CustomerActions />
      </td>
    </tr>
  );
}

export function AdminCustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return CUSTOMERS;
    return CUSTOMERS.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.country.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const stats = useMemo(
    () => ({
      total: CUSTOMERS.length,
      gold: CUSTOMERS.filter((c) => c.tier === 'Gold').length,
      orders: CUSTOMERS.reduce((sum, c) => sum + c.orders, 0),
    }),
    []
  );

  return (
    <AdminPage>
      <AdminPageHeader title="Customers" description="Loyalty members and shopper profiles" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard label="Total customers" value={stats.total} icon={Users} accent="text-foreground" />
        <StatCard label="Gold members" value={stats.gold} icon={Crown} accent="text-amber-600" />
        <StatCard
          label="Total orders"
          value={stats.orders}
          icon={ShoppingBag}
          accent="text-primary"
        />
      </div>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg font-light tracking-tight">Customer directory</CardTitle>
              <CardDescription>
                {filteredCustomers.length} of {CUSTOMERS.length} customers
              </CardDescription>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search name, email, or country…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCustomers.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <UserCheck className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No customers match your search.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchTerm('')}>
                Clear search
              </Button>
            </div>
          ) : (
            <>
              <div className="md:hidden">
                {filteredCustomers.map((customer) => (
                  <MobileCustomerRow key={customer.id} customer={customer} />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Customer
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Country
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Tier
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Orders
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Spent
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Last order
                      </th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <DesktopCustomerRow key={customer.id} customer={customer} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AdminPage>
  );
}
