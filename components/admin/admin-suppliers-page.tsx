'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  Truck,
} from 'lucide-react';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSuppliers } from '@/lib/suppliers-context';
import {
  getAllSupplierCatalogCounts,
  type SupplierCatalogCounts,
} from '@/lib/firebase/suppliers';
import { DEFAULT_SUPPLIER_ID } from '@/lib/types/suppliers';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type FilterId = 'all' | 'active' | 'inactive' | 'default';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'default', label: 'Default' },
];

function emptyCounts(): SupplierCatalogCounts {
  return { products: 0, packages: 0, services: 0, total: 0 };
}

export function AdminSuppliersPage() {
  const { suppliers, loading, update, remove, refreshReady } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [counts, setCounts] = useState<Record<string, SupplierCatalogCounts>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshReady();
        const next = await getAllSupplierCatalogCounts();
        if (!cancelled) setCounts(next);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setCountsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshReady, suppliers.length]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      if (filter === 'active' && !supplier.isActive) return false;
      if (filter === 'inactive' && supplier.isActive) return false;
      if (filter === 'default' && !supplier.isDefault) return false;
      if (!q) return true;
      const haystack = [
        supplier.name,
        supplier.companyName,
        supplier.contactName,
        supplier.email,
        supplier.phone,
        supplier.city,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [suppliers, searchTerm, filter]);

  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.isActive).length;
    const inactive = total - active;
    const linked = Object.values(counts).reduce((sum, c) => sum + c.total, 0);
    return { total, active, inactive, linked };
  }, [suppliers, counts]);

  const handleToggleActive = async (id: string, isActive: boolean, name: string) => {
    try {
      await update(id, { isActive: !isActive });
      toast.success(`${name} marked ${isActive ? 'inactive' : 'active'}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update supplier');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === DEFAULT_SUPPLIER_ID) {
      toast.error('The default SheQueen supplier cannot be deleted.');
      return;
    }
    if (
      !confirm(
        `Delete "${name}"? Linked catalog items will move to the default supplier.`
      )
    ) {
      return;
    }
    try {
      await remove(id);
      toast.success('Supplier deleted');
      const next = await getAllSupplierCatalogCounts();
      setCounts(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete supplier');
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Suppliers"
        description="Manage vendors for products, packages, and services."
        action={
          <Link
            href="/admin/suppliers/new"
            className={cn(buttonVariants({ size: 'lg' }), 'gap-2 md:hidden')}
          >
            <Plus className="h-4 w-4" />
            Add supplier
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[
          { label: 'Total suppliers', value: stats.total, icon: Truck },
          { label: 'Active', value: stats.active, icon: Building2 },
          { label: 'Inactive', value: stats.inactive, icon: Building2 },
          { label: 'Catalog items linked', value: stats.linked, icon: Building2 },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/70 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {countsLoading && stat.label === 'Catalog items linked' ? '—' : stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative mb-6 md:hidden">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search suppliers…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
        />
      </div>

      <Card>
        <CardHeader className="border-b border-border/60 md:bg-muted/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Supplier directory</CardTitle>
              <CardDescription>
                {loading
                  ? 'Loading suppliers…'
                  : `${filtered.length} supplier${filtered.length === 1 ? '' : 's'} shown`}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative hidden w-full sm:max-w-xs md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search by name, phone, city…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Link
                href="/admin/suppliers/new"
                className={cn(buttonVariants({ size: 'lg' }), 'hidden shrink-0 gap-2 md:inline-flex')}
              >
                <Plus className="h-4 w-4" />
                Add supplier
              </Link>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  filter === item.id
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-14">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Truck className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No suppliers found</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {searchTerm || filter !== 'all'
                  ? 'Try a different search or filter.'
                  : 'Create your first supplier to assign vendors when listing catalog items.'}
              </p>
              {!searchTerm && filter === 'all' && (
                <Link
                  href="/admin/suppliers/new"
                  className={cn(buttonVariants({ size: 'lg' }), 'mt-4 gap-2')}
                >
                  <Plus className="h-4 w-4" />
                  Add supplier
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="md:hidden">
                {filtered.map((supplier) => {
                  const c = counts[supplier.id] ?? emptyCounts();
                  return (
                    <div
                      key={supplier.id}
                      className="border-b border-border/60 px-4 py-3 last:border-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold">{supplier.name}</p>
                            {supplier.isDefault && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                Default
                              </span>
                            )}
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                supplier.isActive
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {supplier.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {[supplier.companyName, supplier.city, supplier.phone]
                              .filter(Boolean)
                              .join(' · ') || 'No contact details'}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {c.products} products · {c.packages} packages · {c.services} services
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/admin/suppliers/${supplier.id}/edit`}
                          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'gap-1')}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleToggleActive(supplier.id, supplier.isActive, supplier.name)
                          }
                        >
                          {supplier.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        {supplier.id !== DEFAULT_SUPPLIER_ID && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(supplier.id, supplier.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Supplier
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Contact
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        City
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Catalog
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
                    {filtered.map((supplier) => {
                      const c = counts[supplier.id] ?? emptyCounts();
                      return (
                        <tr key={supplier.id} className="border-b border-border/50 last:border-0">
                          <td className="px-5 py-3.5">
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {supplier.companyName || '—'}
                              {supplier.isDefault ? ' · Default' : ''}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium">{supplier.contactName || '—'}</p>
                            <p className="text-xs text-muted-foreground">
                              {[supplier.phone, supplier.email].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {supplier.city || '—'}
                          </td>
                          <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                            {c.products}/{c.packages}/{c.services}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                supplier.isActive
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {supplier.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/admin/suppliers/${supplier.id}/edit`}
                                className={cn(
                                  buttonVariants({ size: 'sm', variant: 'outline' }),
                                  'gap-1'
                                )}
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit
                              </Link>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleToggleActive(
                                    supplier.id,
                                    supplier.isActive,
                                    supplier.name
                                  )
                                }
                              >
                                {supplier.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              {supplier.id !== DEFAULT_SUPPLIER_ID && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(supplier.id, supplier.name)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
