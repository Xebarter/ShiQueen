'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Crown,
  Edit,
  Loader2,
  Mail,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
  ShoppingBag,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { subscribeOrders } from '@/lib/firebase/orders';
import {
  createCustomerProfile,
  deleteUserProfile,
  subscribeUsers,
  updateUserProfile,
} from '@/lib/firebase/users';
import { Order, UserProfile, UserRole } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { getEmailInitial, getAvatarColorsForLetter } from '@/lib/user-display';
import { cn } from '@/lib/utils';

type CustomerTier = 'Gold' | 'Silver' | 'Bronze';

type CustomerRecord = {
  id: string;
  uid: string | null;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  orders: number;
  totalSpent: number;
  lastOrder: Date | null;
  tier: CustomerTier;
  role?: UserRole;
  isRegistered: boolean;
};

type CustomerFormMode =
  | { type: 'create'; email?: string; displayName?: string }
  | { type: 'edit'; uid: string; email: string; displayName: string; role: UserRole }
  | null;

function computeTier(totalSpent: number): CustomerTier {
  if (totalSpent >= 1_000_000) return 'Gold';
  if (totalSpent >= 500_000) return 'Silver';
  return 'Bronze';
}

function buildCustomerRecords(users: UserProfile[], orders: Order[]): CustomerRecord[] {
  const registeredUids = new Set(users.map((u) => u.uid));
  const byEmail = new Map<string, CustomerRecord>();

  for (const user of users.filter((u) => u.role === 'customer')) {
    byEmail.set(user.email.toLowerCase(), {
      id: user.uid,
      uid: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      orders: 0,
      totalSpent: 0,
      lastOrder: null,
      tier: 'Bronze',
      role: user.role,
      isRegistered: true,
    });
  }

  for (const order of orders) {
    if (order.status === 'cancelled') continue;

    const email = order.email.toLowerCase();
    let record = byEmail.get(email);

    if (!record) {
      const uid = order.userId && registeredUids.has(order.userId) ? order.userId : null;
      record = {
        id: uid ?? `guest:${email}`,
        uid,
        name: order.customerName,
        email: order.email,
        phone: order.shippingAddress?.phone,
        country: order.shippingAddress?.country,
        orders: 0,
        totalSpent: 0,
        lastOrder: null,
        tier: 'Bronze',
        isRegistered: uid !== null,
      };
      byEmail.set(email, record);
    }

    record.orders += 1;
    record.totalSpent += order.total;

    if (!record.lastOrder || order.createdAt > record.lastOrder) {
      record.lastOrder = order.createdAt;
      record.phone = record.phone || order.shippingAddress?.phone;
      record.country = record.country || order.shippingAddress?.country;
    }

    if (order.customerName && (!record.name || record.name === record.email.split('@')[0])) {
      record.name = order.customerName;
    }

    if (order.userId && registeredUids.has(order.userId)) {
      record.uid = order.userId;
      record.id = order.userId;
      record.isRegistered = true;
    }
  }

  for (const record of byEmail.values()) {
    record.tier = computeTier(record.totalSpent);
  }

  return Array.from(byEmail.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

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

function formatLastOrder(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
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

function CustomerFormPanel({
  mode,
  onClose,
  onSaved,
}: {
  mode: CustomerFormMode;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode?.type === 'edit') {
      setEmail(mode.email);
      setDisplayName(mode.displayName);
      setRole(mode.role);
    } else if (mode?.type === 'create') {
      setEmail(mode.email ?? '');
      setDisplayName(mode.displayName ?? '');
      setRole('customer');
    } else {
      setEmail('');
      setDisplayName('');
      setRole('customer');
    }
  }, [mode]);

  if (!mode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error('Email is required');
      return;
    }

    setSaving(true);
    try {
      if (mode.type === 'create') {
        await createCustomerProfile({ email: trimmedEmail, displayName: displayName.trim() || undefined });
        toast.success('Customer created');
      } else {
        await updateUserProfile(mode.uid, {
          email: trimmedEmail,
          displayName: displayName.trim() || undefined,
          role,
        });
        toast.success('Customer updated');
      }
      onSaved();
      onClose();
    } catch {
      toast.error(mode.type === 'create' ? 'Failed to create customer' : 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6 overflow-hidden border-primary/20 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/10 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">
            {mode.type === 'create' ? 'Add customer' : 'Edit customer'}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {mode.type === 'create'
            ? 'Creates a profile in Firestore. They can sign up later with the same email.'
            : 'Updates the customer profile in Firestore.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="customer-email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="customer-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="customer@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="customer-name" className="text-sm font-medium">
              Display name
            </label>
            <input
              id="customer-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Jane Doe"
            />
          </div>
          {mode.type === 'edit' && (
            <div className="space-y-1.5">
              <label htmlFor="customer-role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="customer-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="customer">customer</option>
                <option value="admin">admin</option>
              </select>
            </div>
          )}
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode.type === 'create' ? 'Create customer' : 'Save changes'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CustomerActions({
  customer,
  compact,
  onEdit,
  onDelete,
  onRegister,
}: {
  customer: CustomerRecord;
  compact?: boolean;
  onEdit: (customer: CustomerRecord) => void;
  onDelete: (customer: CustomerRecord) => void;
  onRegister: (customer: CustomerRecord) => void;
}) {
  return (
    <div className={cn('flex items-center gap-1', compact ? 'shrink-0' : 'justify-end')}>
      <a href={`mailto:${customer.email}`}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Email customer">
          <Mail className="h-4 w-4" />
        </Button>
      </a>
      {customer.isRegistered && customer.uid ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Edit customer"
            onClick={() => onEdit(customer)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            aria-label="Delete customer"
            onClick={() => onDelete(customer)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className={cn(compact ? 'h-8 px-2 text-xs' : 'h-8 gap-1 px-2 text-xs')}
          onClick={() => onRegister(customer)}
        >
          <Plus className="h-3.5 w-3.5" />
          {!compact && 'Add to directory'}
        </Button>
      )}
    </div>
  );
}

function MobileCustomerRow({
  customer,
  onEdit,
  onDelete,
  onRegister,
}: {
  customer: CustomerRecord;
  onEdit: (customer: CustomerRecord) => void;
  onDelete: (customer: CustomerRecord) => void;
  onRegister: (customer: CustomerRecord) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0">
      <CustomerAvatar name={customer.name} email={customer.email} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{customer.name}</p>
          <TierBadge tier={customer.tier} />
        </div>
        <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
        {!customer.isRegistered && (
          <p className="text-[10px] text-muted-foreground">Guest · from orders</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold">{formatUGX(customer.totalSpent)}</p>
        <p className="text-[11px] text-muted-foreground">{customer.orders} orders</p>
      </div>
      <CustomerActions
        customer={customer}
        compact
        onEdit={onEdit}
        onDelete={onDelete}
        onRegister={onRegister}
      />
    </div>
  );
}

function DesktopCustomerRow({
  customer,
  onEdit,
  onDelete,
  onRegister,
}: {
  customer: CustomerRecord;
  onEdit: (customer: CustomerRecord) => void;
  onDelete: (customer: CustomerRecord) => void;
  onRegister: (customer: CustomerRecord) => void;
}) {
  return (
    <tr className="group border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <CustomerAvatar name={customer.name} email={customer.email} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{customer.name}</p>
            <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
            {!customer.isRegistered && (
              <p className="text-[10px] text-muted-foreground">Guest checkout</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-muted-foreground">{customer.country || '—'}</td>
      <td className="px-5 py-3.5">
        <TierBadge tier={customer.tier} />
      </td>
      <td className="px-5 py-3.5 text-sm font-semibold tabular-nums">{customer.orders}</td>
      <td className="px-5 py-3.5 text-sm font-semibold">{formatUGX(customer.totalSpent)}</td>
      <td className="px-5 py-3.5 text-sm text-muted-foreground">
        {formatLastOrder(customer.lastOrder)}
      </td>
      <td className="px-5 py-3.5">
        <CustomerActions
          customer={customer}
          onEdit={onEdit}
          onDelete={onDelete}
          onRegister={onRegister}
        />
      </td>
    </tr>
  );
}

export function AdminCustomersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formMode, setFormMode] = useState<CustomerFormMode>(null);

  useEffect(() => {
    const unsubUsers = subscribeUsers(
      (nextUsers) => {
        setUsers(nextUsers);
        setUsersLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error('Failed to load customers');
        setUsersLoading(false);
      }
    );

    const unsubOrders = subscribeOrders(
      (nextOrders) => {
        setOrders(nextOrders);
        setOrdersLoading(false);
      },
      (error) => {
        console.error(error);
        setOrdersLoading(false);
      }
    );

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, []);

  const customers = useMemo(() => buildCustomerRecords(users, orders), [users, orders]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        (customer.country?.toLowerCase().includes(term) ?? false)
    );
  }, [customers, searchTerm]);

  const stats = useMemo(
    () => ({
      total: customers.length,
      gold: customers.filter((c) => c.tier === 'Gold').length,
      orders: customers.reduce((sum, c) => sum + c.orders, 0),
      registered: customers.filter((c) => c.isRegistered).length,
    }),
    [customers]
  );

  const loading = usersLoading || ordersLoading;

  const handleEdit = (customer: CustomerRecord) => {
    if (!customer.uid || !customer.isRegistered) return;
    setFormMode({
      type: 'edit',
      uid: customer.uid,
      email: customer.email,
      displayName: customer.name,
      role: customer.role ?? 'customer',
    });
  };

  const handleDelete = async (customer: CustomerRecord) => {
    if (!customer.uid || !customer.isRegistered) return;
    if (!confirm(`Delete profile for "${customer.name}"? Order history will remain.`)) return;

    try {
      await deleteUserProfile(customer.uid);
      toast.success('Customer deleted');
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  const handleRegisterGuest = (customer: CustomerRecord) => {
    setFormMode({
      type: 'create',
      email: customer.email,
      displayName: customer.name,
    });
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Customers"
        description="Live shopper profiles from Firestore and order history"
        action={
          <Button className="gap-2" onClick={() => setFormMode({ type: 'create' })}>
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        }
      />

      {formMode && (
        <CustomerFormPanel
          mode={formMode}
          onClose={() => setFormMode(null)}
          onSaved={() => setFormMode(null)}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard label="Total customers" value={stats.total} icon={Users} accent="text-foreground" />
            <StatCard label="Registered" value={stats.registered} icon={UserCheck} accent="text-sky-600" />
            <StatCard label="Gold members" value={stats.gold} icon={Crown} accent="text-amber-600" />
            <StatCard label="Total orders" value={stats.orders} icon={ShoppingBag} accent="text-primary" />
          </div>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg font-light tracking-tight">Customer directory</CardTitle>
                  <CardDescription>
                    {filteredCustomers.length} of {customers.length} customers
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
                  <p className="text-sm text-muted-foreground">
                    {customers.length === 0
                      ? 'No customers yet. Add one or wait for checkouts.'
                      : 'No customers match your search.'}
                  </p>
                  {searchTerm && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchTerm('')}>
                      Clear search
                    </Button>
                  )}
                  {customers.length === 0 && (
                    <Button className="mt-4 gap-2" onClick={() => setFormMode({ type: 'create' })}>
                      <Plus className="h-4 w-4" />
                      Add customer
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="md:hidden">
                    {filteredCustomers.map((customer) => (
                      <MobileCustomerRow
                        key={customer.id}
                        customer={customer}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onRegister={handleRegisterGuest}
                      />
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
                          <DesktopCustomerRow
                            key={customer.id}
                            customer={customer}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onRegister={handleRegisterGuest}
                          />
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
