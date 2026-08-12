'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Check,
  Clock,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSuppliers } from '@/lib/suppliers-context';
import {
  getAllSupplierCatalogCounts,
  setSupplierApprovalStatus,
  type SupplierCatalogCounts,
} from '@/lib/firebase/suppliers';
import {
  DEFAULT_SUPPLIER_ID,
  SUPPLIER_APPROVAL_OPTIONS,
  type Supplier,
  type SupplierApprovalStatus,
} from '@/lib/types/suppliers';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type FilterId = 'all' | SupplierApprovalStatus | 'default';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'default', label: 'Default' },
];

const STATUS_META: Record<
  SupplierApprovalStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending approval',
    className: 'bg-amber-500/15 text-amber-800 ring-amber-500/25',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-rose-500/15 text-rose-800 ring-rose-500/25',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-slate-500/15 text-slate-800 ring-slate-500/25',
  },
};

function emptyCounts(): SupplierCatalogCounts {
  return { products: 0, packages: 0, services: 0, total: 0 };
}

function ApprovalBadge({ status }: { status: SupplierApprovalStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

function formatApplied(date: Date) {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function AdminSuppliersPage() {
  const { suppliers, loading, update, remove, refreshReady } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [counts, setCounts] = useState<Record<string, SupplierCatalogCounts>>({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      if (filter === 'default' && !supplier.isDefault) return false;
      if (
        filter !== 'all' &&
        filter !== 'default' &&
        supplier.approvalStatus !== filter
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        supplier.name,
        supplier.companyName,
        supplier.contactName,
        supplier.email,
        supplier.phone,
        supplier.city,
        supplier.approvalStatus,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [suppliers, searchTerm, filter]);

  const stats = useMemo(() => {
    return {
      total: suppliers.length,
      pending: suppliers.filter((s) => s.approvalStatus === 'pending').length,
      approved: suppliers.filter((s) => s.approvalStatus === 'approved').length,
      linked: Object.values(counts).reduce((sum, c) => sum + c.total, 0),
    };
  }, [suppliers, counts]);

  const handleApproval = async (
    supplier: Supplier,
    approvalStatus: SupplierApprovalStatus
  ) => {
    if (supplier.id === DEFAULT_SUPPLIER_ID && approvalStatus !== 'approved') {
      toast.error('The default SheQueen supplier must stay approved.');
      return;
    }

    let rejectionReason: string | undefined;
    if (approvalStatus === 'rejected') {
      rejectionReason =
        prompt('Optional rejection reason (shown to admin notes):') ?? undefined;
    }

    setBusyId(supplier.id);
    try {
      await setSupplierApprovalStatus(supplier.id, approvalStatus, {
        rejectionReason,
      });
      toast.success(
        `${supplier.name} marked ${STATUS_META[approvalStatus].label.toLowerCase()}`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (supplier: Supplier) => {
    if (supplier.approvalStatus !== 'approved') {
      toast.error('Only approved suppliers can be activated or paused.');
      return;
    }
    setBusyId(supplier.id);
    try {
      await update(supplier.id, { isActive: !supplier.isActive });
      toast.success(
        `${supplier.name} ${supplier.isActive ? 'paused on storefront' : 'activated on storefront'}`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update supplier');
    } finally {
      setBusyId(null);
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
    setBusyId(id);
    try {
      await remove(id);
      toast.success('Supplier deleted');
      const next = await getAllSupplierCatalogCounts();
      setCounts(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete supplier');
    } finally {
      setBusyId(null);
    }
  };

  const renderActions = (supplier: Supplier) => {
    const busy = busyId === supplier.id;
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {supplier.approvalStatus === 'pending' && (
          <>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => handleApproval(supplier, 'approved')}
              className="gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => handleApproval(supplier, 'rejected')}
              className="gap-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </Button>
          </>
        )}
        {supplier.approvalStatus === 'approved' &&
          supplier.id !== DEFAULT_SUPPLIER_ID && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => handleApproval(supplier, 'suspended')}
            >
              Suspend
            </Button>
          )}
        {(supplier.approvalStatus === 'rejected' ||
          supplier.approvalStatus === 'suspended') && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => handleApproval(supplier, 'approved')}
            className="gap-1"
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
        )}
        {supplier.approvalStatus === 'approved' && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => handleToggleActive(supplier)}
          >
            {supplier.isActive ? 'Pause' : 'Unpause'}
          </Button>
        )}
        <Link
          href={`/admin/suppliers/${supplier.id}`}
          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'gap-1')}
        >
          View
        </Link>
        <Link
          href={`/admin/suppliers/${supplier.id}/edit`}
          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'gap-1')}
        >
          <Edit className="h-3.5 w-3.5" />
          Edit
        </Link>
        {supplier.id !== DEFAULT_SUPPLIER_ID && (
          <Button
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => handleDelete(supplier.id, supplier.name)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Suppliers"
        description="Review supplier applications and manage who appears on the storefront."
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
          { label: 'Pending approval', value: stats.pending, icon: Clock },
          { label: 'Approved', value: stats.approved, icon: Check },
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
                  {countsLoading && stat.label === 'Catalog items linked'
                    ? '—'
                    : stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Supplier directory</CardTitle>
              <CardDescription>
                {loading
                  ? 'Loading suppliers…'
                  : `${filtered.length} of ${suppliers.length} suppliers`}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search name, email, phone…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Link
                href="/admin/suppliers/new"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'hidden shrink-0 gap-2 md:inline-flex'
                )}
              >
                <Plus className="h-4 w-4" />
                Add supplier
              </Link>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  'h-8 w-full rounded-lg border px-1.5 text-[11px] font-semibold capitalize transition sm:text-xs',
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

        <CardContent className="bg-muted/15 p-3 sm:p-4">
          {loading ? (
            <div className="flex justify-center py-14">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-card px-6 py-14 text-center">
              <Truck className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No suppliers found</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {searchTerm || filter !== 'all'
                  ? 'Try a different search or filter.'
                  : 'Suppliers who sign up at /supplier appear here for approval.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((supplier) => {
                const c = counts[supplier.id] ?? emptyCounts();
                return (
                  <div
                    key={supplier.id}
                    className="rounded-xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-primary/25 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <Link
                        href={`/admin/suppliers/${supplier.id}`}
                        className="min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold group-hover:text-primary hover:text-primary">
                            {supplier.name}
                          </p>
                          <ApprovalBadge status={supplier.approvalStatus} />
                          {supplier.isDefault && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              Default
                            </span>
                          )}
                          {supplier.approvalStatus === 'approved' && !supplier.isActive && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                              Paused
                            </span>
                          )}
                          {supplier.ownerUid && (
                            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Self-serve
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[supplier.companyName, supplier.contactName, supplier.city]
                            .filter(Boolean)
                            .join(' · ') || 'No company details'}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[supplier.email, supplier.phone].filter(Boolean).join(' · ') ||
                            'No contact'}
                        </p>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {c.products} products · {c.packages} packages · {c.services}{' '}
                          services
                          <span className="mx-1.5 text-border">·</span>
                          Applied {formatApplied(supplier.createdAt)}
                        </p>
                        {supplier.rejectionReason && (
                          <p className="mt-2 text-xs text-rose-700">
                            Reason: {supplier.rejectionReason}
                          </p>
                        )}
                      </Link>
                      <div
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {renderActions(supplier)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Status meanings:{' '}
        {SUPPLIER_APPROVAL_OPTIONS.map((o) => o.label).join(' · ')}. Only{' '}
        <strong>approved</strong> and unpaused suppliers appear on public catalog pages.
      </p>
    </AdminPage>
  );
}
