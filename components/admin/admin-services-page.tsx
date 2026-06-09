'use client';

import { useMemo, useState } from 'react';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useServices } from '@/lib/services-context';
import {
  updateServiceCategory,
  deleteServiceCategory,
} from '@/lib/firebase/service-categories';
import {
  createServiceProvider,
  updateServiceProvider,
  deleteServiceProvider,
} from '@/lib/firebase/service-providers';
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
import { upsertProviderAvailability } from '@/lib/firebase/provider-availability';
import { slugifyServiceName, getDefaultWeeklySlots } from '@/lib/services-utils';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Calendar,
  FolderOpen,
  Loader2,
  MessageSquare,
  Scissors,
  Star,
  Users,
} from 'lucide-react';
import type { ServiceBookingStatus } from '@/lib/types/services';

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
  const [tab, setTab] = useState<TabId>('overview');
  const [busy, setBusy] = useState(false);

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

  const handleCreateProvider = async () => {
    const name = prompt('Provider full name?');
    if (!name?.trim()) return;
    const business = prompt('Business name?') ?? name;
    const phone = prompt('Phone (07XXXXXXXX)?') ?? '';
    const id = slugifyServiceName(business) || `provider-${Date.now()}`;
    setBusy(true);
    try {
      await createServiceProvider({
        id,
        name: name.trim(),
        businessName: business.trim(),
        phone,
        whatsapp: phone,
        email: '',
        address: '',
        city: 'Kampala',
        profileImage: '',
        bio: '',
        experienceYears: 1,
        categoryIds: [],
        portfolioImages: [],
        isVerified: false,
        isActive: true,
        mobileServiceEnabled: false,
        serviceRadiusKm: 0,
        serviceAreas: ['Kampala'],
        travelFee: 0,
        rating: 0,
        reviewCount: 0,
        completedJobs: 0,
      });
      await upsertProviderAvailability({
        id,
        providerId: id,
        weeklySlots: getDefaultWeeklySlots(),
        blackoutDates: [],
        slotDurationMinutes: 60,
      });
      toast.success('Provider created');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateService = async () => {
    const name = prompt('Service name?');
    if (!name?.trim()) return;
    const providerId = providers[0]?.id;
    const categoryId = categories[0]?.id;
    if (!providerId || !categoryId) {
      toast.error('Add a provider and category first');
      return;
    }
    const priceStr = prompt('Base price (UGX)?', '100000');
    const id = `svc-${slugifyServiceName(name)}-${Date.now().toString(36).slice(-4)}`;
    const slug = slugifyServiceName(name);
    setBusy(true);
    try {
      await createServiceListing({
        id,
        slug,
        name: name.trim(),
        description: '',
        benefits: [],
        categoryId,
        serviceType: name.trim(),
        providerId,
        durationMinutes: 60,
        basePrice: Number(priceStr) || 100000,
        galleryImages: [],
        isFeatured: false,
        isPopular: false,
        isActive: true,
        isArchived: false,
        supportsMobile: true,
        supportsInStudio: true,
        location: 'Kampala',
        bookingCount: 0,
        viewCount: 0,
        rating: 0,
        reviewCount: 0,
        sortOrder: listings.length + 1,
      });
      toast.success('Service created');
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
        description="Manage categories, providers, listings, bookings, and reviews."
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
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
                {stats.topServices.map((s) => (
                  <div key={s.id} className="flex justify-between">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground">{s.bookingCount} bookings</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top providers</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {stats.topProviders.map((p) => (
                  <div key={p.id} className="flex justify-between">
                    <span>{p.businessName}</span>
                    <span className="text-muted-foreground">{p.completedJobs} jobs</span>
                  </div>
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
          <Button onClick={handleCreateService} disabled={busy}>Add service</Button>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3">{s.name}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'providers' && (
        <div className="space-y-4">
          <Button onClick={handleCreateProvider} disabled={busy}>Add provider</Button>
          {providers.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{p.businessName}</p>
                  <p className="text-sm text-muted-foreground">{p.name} · {p.phone}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateServiceProvider(p.id, { isVerified: !p.isVerified }).then(() => toast.success('Updated'))}>
                    {p.isVerified ? 'Unverify' : 'Verify'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateServiceProvider(p.id, { isActive: !p.isActive }).then(() => toast.success('Updated'))}>
                    {p.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm('Delete provider?')) deleteServiceProvider(p.id).then(() => toast.success('Deleted')); }}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'availability' && (
        <div className="space-y-4">
          {providers.map((p) => {
            const avail = availability.find((a) => a.providerId === p.id);
            return (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-base">{p.businessName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Slot duration: {avail?.slotDurationMinutes ?? 60} min
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      upsertProviderAvailability({
                        id: p.id,
                        providerId: p.id,
                        weeklySlots: getDefaultWeeklySlots(),
                        blackoutDates: avail?.blackoutDates ?? [],
                        slotDurationMinutes: 60,
                      }).then(() => toast.success('Default availability saved'))
                    }
                  >
                    Reset to default hours (Mon–Sat)
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'bookings' && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const svc = listings.find((l) => l.id === b.serviceId);
                return (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.customerName}</p>
                      <p className="text-xs text-muted-foreground">{svc?.name}</p>
                    </td>
                    <td className="px-4 py-3">{b.date} {b.timeSlot}</td>
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
