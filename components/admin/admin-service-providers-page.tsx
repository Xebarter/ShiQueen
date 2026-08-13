'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  Check,
  Edit,
  Loader2,
  MapPin,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { AdminEntityThumb } from '@/components/admin/admin-entity-thumb';
import { AdminBulkApproveBar, AdminSelectCheckbox } from '@/components/admin/admin-bulk-approve';
import { useServices } from '@/lib/services-context';
import {
  updateServiceProvider,
  deleteServiceProvider,
  setProviderApprovalStatus,
} from '@/lib/firebase/service-providers';
import type { ServiceProvider } from '@/lib/types/services';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type FilterId =
  | 'all'
  | 'pending'
  | 'approved'
  | 'active'
  | 'inactive'
  | 'verified'
  | 'unverified'
  | 'mobile';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'verified', label: 'Verified' },
  { id: 'unverified', label: 'Unverified' },
  { id: 'mobile', label: 'Mobile' },
];

function formatJoined(date: Date) {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function AdminServiceProvidersDirectory() {
  const { providers, listings, categories, loading } = useServices();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const listingCounts = useMemo(() => {
    const map: Record<string, { total: number; active: number }> = {};
    for (const listing of listings) {
      const current = map[listing.providerId] ?? { total: 0, active: 0 };
      current.total += 1;
      if (listing.isActive && !listing.isArchived) current.active += 1;
      map[listing.providerId] = current;
    }
    return map;
  }, [listings]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return providers
      .filter((provider) => {
        if (filter === 'pending' && provider.approvalStatus !== 'pending') return false;
        if (filter === 'approved' && provider.approvalStatus !== 'approved') return false;
        if (filter === 'active' && !provider.isActive) return false;
        if (filter === 'inactive' && provider.isActive) return false;
        if (filter === 'verified' && !provider.isVerified) return false;
        if (filter === 'unverified' && provider.isVerified) return false;
        if (filter === 'mobile' && !provider.mobileServiceEnabled) return false;
        if (!q) return true;
      const categoryNames = provider.categoryIds
        .map((id) => categories.find((c) => c.id === id)?.name ?? '')
        .join(' ');
      const haystack = [
        provider.name,
        provider.businessName,
        provider.email,
        provider.phone,
        provider.city,
        provider.serviceAreas.join(' '),
        categoryNames,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    })
      .sort((a, b) => {
        const rank = (status: string) =>
          status === 'pending' ? 0 : status === 'rejected' ? 1 : 2;
        return rank(a.approvalStatus) - rank(b.approvalStatus);
      });
  }, [providers, searchTerm, filter, categories]);

  const stats = useMemo(
    () => ({
      total: providers.length,
      pending: providers.filter((p) => p.approvalStatus === 'pending').length,
      active: providers.filter((p) => p.isActive).length,
      verified: providers.filter((p) => p.isVerified).length,
      listings: listings.filter((l) => !l.isArchived).length,
    }),
    [providers, listings]
  );

  const pendingInView = useMemo(
    () => filtered.filter((provider) => provider.approvalStatus === 'pending'),
    [filtered]
  );

  useEffect(() => {
    const allowed = new Set(pendingInView.map((provider) => provider.id));
    setSelectedIds((prev) => {
      const next = prev.filter((id) => allowed.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [pendingInView]);

  const handleToggle = async (
    provider: ServiceProvider,
    patch: Partial<Pick<ServiceProvider, 'isActive' | 'isVerified'>>
  ) => {
    setBusyId(provider.id);
    try {
      await updateServiceProvider(provider.id, patch);
      const label =
        patch.isVerified !== undefined
          ? patch.isVerified
            ? 'verified'
            : 'unverified'
          : patch.isActive
            ? 'activated'
            : 'deactivated';
      toast.success(`${provider.businessName} ${label}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update provider');
    } finally {
      setBusyId(null);
    }
  };

  const handleApproval = async (
    provider: ServiceProvider,
    status: ServiceProvider['approvalStatus']
  ) => {
    let rejectionReason: string | undefined;
    if (status === 'rejected') {
      rejectionReason = window.prompt('Rejection reason (optional)') ?? undefined;
    }
    setBusyId(provider.id);
    try {
      await setProviderApprovalStatus(provider.id, status, { rejectionReason });
      toast.success(`${provider.businessName} ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update approval');
    } finally {
      setBusyId(null);
    }
  };

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((item) => item !== id)
    );
  };

  const handleApproveSelected = async () => {
    const targets = pendingInView.filter((provider) => selectedIds.includes(provider.id));
    if (targets.length === 0) return;
    if (
      !confirm(
        `Approve ${targets.length} provider${targets.length === 1 ? '' : 's'}? They will appear on the services page.`
      )
    ) {
      return;
    }
    setBusyId('bulk');
    try {
      for (const provider of targets) {
        await setProviderApprovalStatus(provider.id, 'approved');
      }
      toast.success(
        targets.length === 1
          ? `${targets[0].businessName || targets[0].name} approved`
          : `${targets.length} providers approved`
      );
      setSelectedIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve providers');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (provider: ServiceProvider) => {
    const counts = listingCounts[provider.id];
    const listingNote = counts?.total
      ? ` ${counts.total} linked listing(s) will be archived.`
      : '';
    if (
      !confirm(
        `Delete "${provider.businessName}"?${listingNote} Bookings are kept for history.`
      )
    ) {
      return;
    }
    setBusyId(provider.id);
    try {
      await deleteServiceProvider(provider.id);
      toast.success('Provider deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete provider');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[
          { label: 'Total providers', value: stats.total, icon: Users },
          { label: 'Pending', value: stats.pending, icon: Star },
          { label: 'Active', value: stats.active, icon: Check },
          { label: 'Verified', value: stats.verified, icon: BadgeCheck },
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
                <p className="text-xl font-bold tabular-nums">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Provider directory</CardTitle>
              <CardDescription>
                {loading
                  ? 'Loading providers…'
                  : `${filtered.length} of ${providers.length} providers`}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search name, phone, city…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Link
                href="/admin/services/providers/new"
                className={cn(buttonVariants({ size: 'lg' }), 'shrink-0 gap-2')}
              >
                <Plus className="h-4 w-4" />
                Add provider
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold capitalize transition sm:text-xs',
                  filter === item.id
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <AdminBulkApproveBar
            pendingCount={pendingInView.length}
            selectedCount={selectedIds.length}
            allSelected={
              pendingInView.length > 0 && selectedIds.length === pendingInView.length
            }
            someSelected={selectedIds.length > 0 && selectedIds.length < pendingInView.length}
            onToggleAll={(checked) =>
              setSelectedIds(checked ? pendingInView.map((provider) => provider.id) : [])
            }
            onApproveSelected={() => void handleApproveSelected()}
            busy={busyId === 'bulk'}
            noun="provider"
          />
        </CardHeader>

        <CardContent className="bg-muted/15 p-3 sm:p-4">
          {loading ? (
            <div className="flex justify-center py-14">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-card px-6 py-14 text-center">
              <Users className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No providers found</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {searchTerm || filter !== 'all'
                  ? 'Try a different search or filter.'
                  : 'Add a stylist or studio so service listings can be assigned.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((provider) => {
                const counts = listingCounts[provider.id] ?? { total: 0, active: 0 };
                const categoryNames = provider.categoryIds
                  .map((id) => categories.find((c) => c.id === id)?.name)
                  .filter(Boolean);
                const busy = busyId === provider.id || busyId === 'bulk';
                return (
                  <div
                    key={provider.id}
                    className="rounded-xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-primary/25 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        {provider.approvalStatus === 'pending' ? (
                          <AdminSelectCheckbox
                            className="mt-2"
                            checked={selectedIds.includes(provider.id)}
                            onChange={(checked) => toggleSelected(provider.id, checked)}
                          />
                        ) : null}
                        <Link
                          href={`/admin/services/providers/${provider.id}`}
                          className="min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                        <div className="flex items-start gap-3">
                          <AdminEntityThumb
                            src={provider.profileImage}
                            label={provider.businessName || provider.name}
                            sizeClassName="h-20 w-20 sm:h-24 sm:w-24"
                            sizes="96px"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-base font-semibold hover:text-primary">
                                {provider.businessName || provider.name}
                              </p>
                              {provider.isVerified && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800 ring-1 ring-inset ring-sky-500/25">
                                  <BadgeCheck className="h-3 w-3" />
                                  Verified
                                </span>
                              )}
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                                  provider.approvalStatus === 'approved'
                                    ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
                                    : provider.approvalStatus === 'pending'
                                      ? 'bg-amber-500/15 text-amber-800 ring-amber-500/25'
                                      : 'bg-slate-500/15 text-slate-700 ring-slate-500/25'
                                )}
                              >
                                {provider.approvalStatus}
                              </span>
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                                  provider.isActive
                                    ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
                                    : 'bg-slate-500/15 text-slate-700 ring-slate-500/25'
                                )}
                              >
                                {provider.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {provider.mobileServiceEnabled && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                  Mobile
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {[provider.name, provider.city].filter(Boolean).join(' · ') ||
                                'No contact details'}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {[provider.phone, provider.email].filter(Boolean).join(' · ') ||
                                'No phone or email'}
                            </p>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              {counts.active} active listings · {counts.total} total
                              <span className="mx-1.5 text-border">·</span>
                              ★ {provider.rating.toFixed(1)} ({provider.reviewCount})
                              <span className="mx-1.5 text-border">·</span>
                              {provider.completedJobs} jobs
                              <span className="mx-1.5 text-border">·</span>
                              Joined {formatJoined(provider.createdAt)}
                            </p>
                            {(categoryNames.length > 0 || provider.serviceAreas.length > 0) && (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {categoryNames.slice(0, 2).join(', ') || 'Uncategorized'}
                                  {provider.serviceAreas.length
                                    ? ` · ${provider.serviceAreas.slice(0, 3).join(', ')}`
                                    : ''}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        </Link>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {provider.approvalStatus === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => handleApproval(provider, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => handleApproval(provider, 'rejected')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {provider.approvalStatus === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => handleApproval(provider, 'suspended')}
                          >
                            Suspend
                          </Button>
                        )}
                        {(provider.approvalStatus === 'rejected' ||
                          provider.approvalStatus === 'suspended') && (
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => handleApproval(provider, 'approved')}
                          >
                            Approve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            handleToggle(provider, { isVerified: !provider.isVerified })
                          }
                          className="gap-1"
                        >
                          {provider.isVerified ? (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Unverify
                            </>
                          ) : (
                            <>
                              <BadgeCheck className="h-3.5 w-3.5" />
                              Verify
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => handleToggle(provider, { isActive: !provider.isActive })}
                        >
                          {provider.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Link
                          href={`/admin/services/providers/${provider.id}`}
                          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/services/providers/${provider.id}/edit`}
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
                          variant="destructive"
                          disabled={busy}
                          onClick={() => handleDelete(provider)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Only <strong>active</strong> providers appear on the public services page. Verified
        providers show a badge on listings. Deleting a provider archives their listings.
      </p>
    </div>
  );
}
