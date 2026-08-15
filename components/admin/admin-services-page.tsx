'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { AdminServiceProvidersDirectory } from '@/components/admin/admin-service-providers-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SupplierSelect } from '@/components/admin/supplier-select';
import { useServices } from '@/lib/services-context';
import { useSuppliers } from '@/lib/suppliers-context';
import {
  updateServiceCategory,
  deleteServiceCategory,
} from '@/lib/firebase/service-categories';
import {
  createServiceListing,
  updateServiceListing,
  deleteServiceListing,
} from '@/lib/firebase/service-listings';
import { updateServiceBookingStatus } from '@/lib/firebase/service-bookings';
import {
  updateServiceReviewVisibility,
  deleteServiceReview,
} from '@/lib/firebase/service-reviews';
import { slugifyServiceName, resolveListingImage } from '@/lib/services-utils';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Calendar,
  FolderOpen,
  Loader2,
  MessageSquare,
  Plus,
  Scissors,
  Star,
  Users,
  X,
} from 'lucide-react';
import type { ServiceBookingStatus } from '@/lib/types/services';
import { AdminEntityThumb } from '@/components/admin/admin-entity-thumb';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
  { id: 'services', label: 'Services', icon: Scissors },
  { id: 'providers', label: 'Providers', icon: Users },
  { id: 'availability', label: 'Availability', icon: Calendar },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
] as const;

type TabId = (typeof TABS)[number]['id'];

const BOOKING_STATUSES: ServiceBookingStatus[] = [
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled',
];

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

export function AdminServicesPage() {
  const {
    categories,
    providers,
    listings,
    bookings,
    reviews,
    availability,
    loading,
  } = useServices();
  const { defaultSupplierId, getSupplierById } = useSuppliers();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>(() => {
    const fromQuery = searchParams.get('tab');
    return isTabId(fromQuery) ? fromQuery : 'overview';
  });
  const [busy, setBusy] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    categoryId: '',
    providerId: '',
    supplierId: '',
    basePrice: '100000',
    durationMinutes: '60',
    location: 'Kampala',
  });

  const stats = useMemo(() => {
    const completed = bookings.filter((b) => b.status === 'completed');
    const revenue = completed.reduce((sum, b) => {
      const svc = listings.find((l) => l.id === b.serviceId);
      return sum + (svc?.basePrice ?? 0);
    }, 0);
    const avgRating =
      listings.length > 0
        ? listings.reduce((s, l) => s + l.rating, 0) / listings.length
        : 0;
    const topServices = [...listings]
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);
    const topProviders = [...providers]
      .sort((a, b) => b.completedJobs - a.completedJobs)
      .slice(0, 5);
    return {
      totalBookings: bookings.length,
      revenue,
      avgRating,
      topServices,
      topProviders,
      pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    };
  }, [bookings, listings, providers]);

  useEffect(() => {
    const fromQuery = searchParams.get('tab');
    if (isTabId(fromQuery) && fromQuery !== tab) setTab(fromQuery);
  }, [searchParams, tab]);

  const selectTab = (id: TabId) => {
    setTab(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id === 'overview') params.delete('tab');
    else params.set('tab', id);
    const qs = params.toString();
    router.replace(qs ? `/admin/services?${qs}` : '/admin/services', { scroll: false });
  };

  const seedCategoriesFromCatalog = async () => {
    setBusy(true);
    try {
      const { ensureServicesSeeded } = await import('@/lib/firebase/seed-services');
      await ensureServicesSeeded();
      toast.success('Services data seeded (categories, providers, listings)');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Seed failed');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleCategory = async (id: string, isActive: boolean) => {
    await updateServiceCategory(id, { isActive: !isActive });
    toast.success('Category updated');
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    await deleteServiceCategory(id);
    toast.success('Category deleted');
  };

  const openServiceForm = () => {
    setServiceForm({
      name: '',
      categoryId: categories.find((c) => c.isActive)?.id ?? categories[0]?.id ?? '',
      providerId: providers.find((p) => p.isActive)?.id ?? providers[0]?.id ?? '',
      supplierId: defaultSupplierId,
      basePrice: '100000',
      durationMinutes: '60',
      location: 'Kampala',
    });
    setShowServiceForm(true);
  };

  const handleCreateService = async () => {
    if (!serviceForm.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    if (!serviceForm.providerId || !serviceForm.categoryId) {
      toast.error('Select a provider and category');
      return;
    }
    if (!serviceForm.supplierId) {
      toast.error('Select a supplier');
      return;
    }

    const id = `svc-${slugifyServiceName(serviceForm.name)}-${Date.now().toString(36).slice(-4)}`;
    const slug = slugifyServiceName(serviceForm.name);
    setBusy(true);
    try {
      await createServiceListing({
        id,
        slug,
        name: serviceForm.name.trim(),
        description: '',
        benefits: [],
        categoryId: serviceForm.categoryId,
        serviceType: serviceForm.name.trim(),
        providerId: serviceForm.providerId,
        supplierId: serviceForm.supplierId,
        durationMinutes: Number(serviceForm.durationMinutes) || 60,
        basePrice: Number(serviceForm.basePrice) || 100000,
        galleryImages: [],
        isFeatured: false,
        isPopular: false,
        isActive: true,
        isArchived: false,
        supportsMobile: true,
        supportsInStudio: true,
        location: serviceForm.location.trim() || 'Kampala',
        bookingCount: 0,
        viewCount: 0,
        rating: 0,
        reviewCount: 0,
        sortOrder: listings.length + 1,
      });
      toast.success('Service created');
      setShowServiceForm(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AdminPage>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Services"
        description="Manage categories, service providers, listings, bookings, and reviews."
        action={
          tab === 'providers' ? (
            <Link
              href="/admin/services/providers/new"
              className={cn(buttonVariants({ size: 'lg' }), 'gap-2 md:hidden')}
            >
              <Plus className="h-4 w-4" />
              Add provider
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition',
              tab === id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total bookings</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{stats.totalBookings}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (completed)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{formatUGX(stats.revenue)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending bookings</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{stats.pendingBookings}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. rating</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-1 text-2xl font-bold">
                <Star className="h-5 w-5 text-amber-500" />
                {stats.avgRating.toFixed(1)}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Top services</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {stats.topServices.map((s) => {
                  const provider = providers.find((p) => p.id === s.providerId);
                  const image = resolveListingImage(s, provider);
                  return (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <AdminEntityThumb
                        src={image}
                        label={s.name}
                        sizeClassName="h-12 w-12"
                        sizes="48px"
                      />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">{s.bookingCount} bookings</span>
                  </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top providers</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {stats.topProviders.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/services/providers/${p.id}`}
                    className="flex items-center justify-between gap-3 hover:text-primary"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <AdminEntityThumb
                        src={p.profileImage}
                        label={p.businessName || p.name}
                        sizeClassName="h-12 w-12"
                        sizes="48px"
                      />
                      <span className="truncate">{p.businessName}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">{p.completedJobs} jobs</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="space-y-4">
          <Button onClick={seedCategoriesFromCatalog} disabled={busy}>
            Seed from additems catalog
          </Button>
          <div className="space-y-3">
            {categories.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.serviceTypes.length} types · {c.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleToggleCategory(c.id, c.isActive)}>
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(c.id, c.name)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Assign a catalog supplier and delivery provider for every listing.
            </p>
            <Button onClick={openServiceForm} disabled={busy} className="gap-2">
              <Plus className="h-4 w-4" />
              Add service
            </Button>
          </div>

          {showServiceForm && (
            <Card className="border-primary/20 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/60">
                <div>
                  <CardTitle>New service listing</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose supplier and provider, then save.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowServiceForm(false)}
                  aria-label="Close form"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="service-name">Service name *</Label>
                  <Input
                    id="service-name"
                    value={serviceForm.name}
                    onChange={(e) =>
                      setServiceForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Bridal Makeup"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-category">Category *</Label>
                  <select
                    id="service-category"
                    value={serviceForm.categoryId}
                    onChange={(e) =>
                      setServiceForm((prev) => ({ ...prev, categoryId: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-provider">Provider *</Label>
                  <select
                    id="service-provider"
                    value={serviceForm.providerId}
                    onChange={(e) =>
                      setServiceForm((prev) => ({ ...prev, providerId: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select provider…</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.businessName || p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <SupplierSelect
                    value={serviceForm.supplierId}
                    onChange={(supplierId) =>
                      setServiceForm((prev) => ({ ...prev, supplierId }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-price">Base price (UGX)</Label>
                  <Input
                    id="service-price"
                    type="number"
                    value={serviceForm.basePrice}
                    onChange={(e) =>
                      setServiceForm((prev) => ({ ...prev, basePrice: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-duration">Duration (minutes)</Label>
                  <Input
                    id="service-duration"
                    type="number"
                    value={serviceForm.durationMinutes}
                    onChange={(e) =>
                      setServiceForm((prev) => ({
                        ...prev,
                        durationMinutes: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="service-location">Location</Label>
                  <Input
                    id="service-location"
                    value={serviceForm.location}
                    onChange={(e) =>
                      setServiceForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <Button onClick={handleCreateService} disabled={busy}>
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      'Create service'
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowServiceForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Provider</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((s) => {
                  const provider = providers.find((p) => p.id === s.providerId);
                  const supplier = getSupplierById(s.supplierId);
                  const image = resolveListingImage(s, provider);
                  return (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AdminEntityThumb src={image} label={s.name} sizeClassName="h-20 w-20" sizes="80px" />
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {provider ? (
                        <Link
                          href={`/admin/services/providers/${provider.id}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <AdminEntityThumb
                            src={provider.profileImage}
                            label={provider.businessName || provider.name}
                            sizeClassName="h-12 w-12"
                        sizes="48px"
                          />
                          <span>{provider.businessName || provider.name}</span>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <AdminEntityThumb
                          src={supplier?.logo}
                          label={supplier?.name ?? 'ShiQueen'}
                          sizeClassName="h-12 w-12"
                        sizes="48px"
                        />
                        <span>{supplier?.name ?? 'ShiQueen'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatUGX(s.basePrice)}</td>
                    <td className="px-4 py-3">
                      {s.isArchived ? 'Archived' : s.isActive ? 'Active' : 'Inactive'}
                      {s.isFeatured && ' · Featured'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" onClick={() => updateServiceListing(s.id, { isFeatured: !s.isFeatured }).then(() => toast.success('Updated'))}>
                          Feature
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateServiceListing(s.id, { isPopular: !s.isPopular }).then(() => toast.success('Updated'))}>
                          Popular
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateServiceListing(s.id, { isArchived: !s.isArchived }).then(() => toast.success('Updated'))}>
                          Archive
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { if (confirm('Delete?')) deleteServiceListing(s.id).then(() => toast.success('Deleted')); }}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'providers' && <AdminServiceProvidersDirectory />}

      {tab === 'availability' && (
        <div className="space-y-4">
          {providers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Add a provider to manage weekly hours.
            </p>
          ) : (
            providers.map((p) => {
              const avail = availability.find((a) => a.providerId === p.id);
              const openDays = Object.entries(avail?.weeklySlots ?? {}).filter(
                ([, ranges]) => (ranges?.length ?? 0) > 0
              ).length;
              return (
                <Card key={p.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium">{p.businessName}</p>
                      <p className="text-sm text-muted-foreground">
                        {openDays} open day{openDays === 1 ? '' : 's'} ·{' '}
                        {avail?.slotDurationMinutes ?? 60} min slots
                        {(avail?.blackoutDates.length ?? 0) > 0
                          ? ` · ${avail?.blackoutDates.length} blackout`
                          : ''}
                      </p>
                    </div>
                    <Link
                      href={`/admin/services/providers/${p.id}`}
                      className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                    >
                      Manage hours
                    </Link>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {tab === 'bookings' && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const svc = listings.find((l) => l.id === b.serviceId);
                const serviceLabel = b.serviceName || svc?.name || 'Service';
                return (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.customerName}</p>
                      <p className="text-xs text-muted-foreground">{serviceLabel}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{b.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      {b.date} {b.timeSlot}
                      <p className="text-xs capitalize text-muted-foreground">{b.locationType}</p>
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {formatUGX(b.total || b.amount || svc?.basePrice || 0)}
                      {b.travelFee > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          incl. {formatUGX(b.travelFee)} travel
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize',
                          b.paymentStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : b.paymentStatus === 'awaiting_payment'
                              ? 'bg-amber-500/15 text-amber-700'
                              : b.paymentStatus === 'failed' || b.paymentStatus === 'cancelled'
                                ? 'bg-red-500/15 text-red-700'
                                : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {(b.paymentStatus ?? 'unpaid').replace(/_/g, ' ')}
                      </span>
                      {b.paytotaReference && (
                        <p className="mt-1 max-w-[140px] truncate font-mono text-[10px] text-muted-foreground">
                          {b.paytotaReference}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">{b.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <select
                        value={b.status}
                        onChange={(e) =>
                          updateServiceBookingStatus(b.id, e.target.value as ServiceBookingStatus).then(() =>
                            toast.success('Status updated')
                          )
                        }
                        className="rounded-lg border px-2 py-1 text-xs"
                      >
                        {BOOKING_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No bookings yet.</p>
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{r.customerName} · ★ {r.rating}</p>
                  <p className="text-sm text-muted-foreground">{r.comment}</p>
                  <p className="text-xs text-muted-foreground">{r.isVisible ? 'Visible' : 'Hidden'}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateServiceReviewVisibility(r.id, !r.isVisible).then(() => toast.success('Updated'))}>
                    {r.isVisible ? 'Hide' : 'Show'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm('Delete review?')) deleteServiceReview(r.id).then(() => toast.success('Deleted')); }}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {reviews.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No reviews yet.</p>
          )}
        </div>
      )}
    </AdminPage>
  );
}
