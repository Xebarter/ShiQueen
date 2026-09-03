'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Edit,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Scissors,
  Star,
  Users,
} from 'lucide-react';
import { AdminPage } from '@/components/admin/admin-page';
import { AdminEntityThumb } from '@/components/admin/admin-entity-thumb';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { isRemoteProductImage } from '@/components/product-image';
import { useServices } from '@/lib/services-context';
import { setProviderApprovalStatus, updateServiceProvider } from '@/lib/firebase/service-providers';
import { upsertProviderAvailability } from '@/lib/firebase/provider-availability';
import { updateServiceBookingStatus } from '@/lib/firebase/service-bookings';
import {
  updateServiceReviewVisibility,
  deleteServiceReview,
} from '@/lib/firebase/service-reviews';
import { buildTelLink, buildWhatsAppLink } from '@/lib/phone-utils';
import { formatUGX } from '@/lib/wholesale-data';
import {
  getDefaultWeeklySlots,
  resolveListingImage,
  WEEKDAYS,
} from '@/lib/services-utils';
import type { ServiceBookingStatus, Weekday } from '@/lib/types/services';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const PROVIDERS_LIST_HREF = '/admin/services?tab=providers';

type DetailTab = 'services' | 'bookings' | 'reviews' | 'availability';

const BOOKING_STATUSES: ServiceBookingStatus[] = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function weekdayLabel(day: Weekday) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export function AdminServiceProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const providerId = params.id;
  const {
    providers,
    listings,
    bookings,
    reviews,
    availability,
    categories,
    loading,
  } = useServices();

  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<DetailTab>('services');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [blackoutDraft, setBlackoutDraft] = useState('');

  const provider = providers.find((p) => p.id === providerId);
  const avail = availability.find((a) => a.providerId === providerId);

  useEffect(() => {
    if (!loading && !provider) {
      router.replace(PROVIDERS_LIST_HREF);
    }
  }, [loading, provider, router]);

  const providerListings = useMemo(
    () => listings.filter((l) => l.providerId === providerId),
    [listings, providerId]
  );
  const providerBookings = useMemo(
    () => bookings.filter((b) => b.providerId === providerId),
    [bookings, providerId]
  );
  const providerReviews = useMemo(
    () => reviews.filter((r) => r.providerId === providerId),
    [reviews, providerId]
  );

  const q = catalogSearch.trim().toLowerCase();
  const filteredListings = useMemo(() => {
    if (!q) return providerListings;
    return providerListings.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.serviceType?.toLowerCase().includes(q)
    );
  }, [providerListings, q]);

  const categoryNames = useMemo(
    () =>
      (provider?.categoryIds ?? [])
        .map((id) => categories.find((c) => c.id === id)?.name)
        .filter((name): name is string => Boolean(name)),
    [provider, categories]
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!provider) return null;

  const handleToggle = async (patch: { isActive?: boolean; isVerified?: boolean }) => {
    setBusy(true);
    try {
      await updateServiceProvider(provider.id, patch);
      toast.success('Provider updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update provider');
    } finally {
      setBusy(false);
    }
  };

  const handleResetAvailability = async () => {
    setBusy(true);
    try {
      await upsertProviderAvailability({
        id: provider.id,
        providerId: provider.id,
        weeklySlots: getDefaultWeeklySlots(),
        blackoutDates: avail?.blackoutDates ?? [],
        slotDurationMinutes: avail?.slotDurationMinutes ?? 60,
      });
      toast.success('Hours reset to Mon–Sat defaults');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update availability');
    } finally {
      setBusy(false);
    }
  };

  const handleSlotDuration = async (slotDurationMinutes: number) => {
    setBusy(true);
    try {
      await upsertProviderAvailability({
        id: provider.id,
        providerId: provider.id,
        weeklySlots: avail?.weeklySlots ?? getDefaultWeeklySlots(),
        blackoutDates: avail?.blackoutDates ?? [],
        slotDurationMinutes,
      });
      toast.success('Slot duration saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update availability');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleDay = async (day: Weekday) => {
    const weeklySlots = { ...(avail?.weeklySlots ?? getDefaultWeeklySlots()) };
    const current = weeklySlots[day] ?? [];
    weeklySlots[day] =
      current.length > 0 ? [] : [{ start: '09:00', end: '18:00' }];
    setBusy(true);
    try {
      await upsertProviderAvailability({
        id: provider.id,
        providerId: provider.id,
        weeklySlots,
        blackoutDates: avail?.blackoutDates ?? [],
        slotDurationMinutes: avail?.slotDurationMinutes ?? 60,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update hours');
    } finally {
      setBusy(false);
    }
  };

  const handleDayHours = async (day: Weekday, start: string, end: string) => {
    const weeklySlots = { ...(avail?.weeklySlots ?? getDefaultWeeklySlots()) };
    weeklySlots[day] = [{ start, end }];
    try {
      await upsertProviderAvailability({
        id: provider.id,
        providerId: provider.id,
        weeklySlots,
        blackoutDates: avail?.blackoutDates ?? [],
        slotDurationMinutes: avail?.slotDurationMinutes ?? 60,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update hours');
    }
  };

  const handleAddBlackout = async () => {
    const date = blackoutDraft.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      toast.error('Use YYYY-MM-DD');
      return;
    }
    const blackoutDates = [...new Set([...(avail?.blackoutDates ?? []), date])];
    setBusy(true);
    try {
      await upsertProviderAvailability({
        id: provider.id,
        providerId: provider.id,
        weeklySlots: avail?.weeklySlots ?? getDefaultWeeklySlots(),
        blackoutDates,
        slotDurationMinutes: avail?.slotDurationMinutes ?? 60,
      });
      setBlackoutDraft('');
      toast.success('Blackout date added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update blackouts');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveBlackout = async (date: string) => {
    setBusy(true);
    try {
      await upsertProviderAvailability({
        id: provider.id,
        providerId: provider.id,
        weeklySlots: avail?.weeklySlots ?? getDefaultWeeklySlots(),
        blackoutDates: (avail?.blackoutDates ?? []).filter((d) => d !== date),
        slotDurationMinutes: avail?.slotDurationMinutes ?? 60,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update blackouts');
    } finally {
      setBusy(false);
    }
  };

  const tabs: { id: DetailTab; label: string; count: number }[] = [
    { id: 'services', label: 'Services', count: providerListings.length },
    { id: 'bookings', label: 'Bookings', count: providerBookings.length },
    { id: 'reviews', label: 'Reviews', count: providerReviews.length },
    { id: 'availability', label: 'Hours', count: Object.keys(avail?.weeklySlots ?? {}).length },
  ];

  return (
    <AdminPage>
      <div className="mb-6">
        <Link
          href={PROVIDERS_LIST_HREF}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to providers
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <AdminEntityThumb
              src={provider.profileImage}
              label={provider.businessName || provider.name}
              sizeClassName="h-24 w-24"
              sizes="96px"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                  {provider.businessName}
                </h1>
                {provider.isVerified && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800 ring-1 ring-inset ring-sky-500/25">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
                    provider.isActive
                      ? 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
                      : 'bg-slate-500/15 text-slate-700 ring-slate-500/25'
                  )}
                >
                  {provider.isActive ? 'Active' : 'Inactive'}
                </span>
                {provider.mobileServiceEnabled && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Mobile
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                {provider.name}
                {provider.experienceYears
                  ? ` · ${provider.experienceYears} years experience`
                  : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {provider.approvalStatus === 'pending' && (
              <>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await setProviderApprovalStatus(provider.id, 'approved');
                      toast.success('Provider approved');
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Failed');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    const reason = window.prompt('Rejection reason (optional)') ?? undefined;
                    setBusy(true);
                    try {
                      await setProviderApprovalStatus(provider.id, 'rejected', {
                        rejectionReason: reason,
                      });
                      toast.success('Provider rejected');
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Failed');
                    } finally {
                      setBusy(false);
                    }
                  }}
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
                onClick={async () => {
                  setBusy(true);
                  try {
                    await setProviderApprovalStatus(provider.id, 'suspended');
                    toast.success('Provider suspended');
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Suspend
              </Button>
            )}
            {(provider.approvalStatus === 'rejected' ||
              provider.approvalStatus === 'suspended') && (
              <Button
                size="sm"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await setProviderApprovalStatus(provider.id, 'approved');
                    toast.success('Provider approved');
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Approve
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => handleToggle({ isVerified: !provider.isVerified })}
              className="gap-1"
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              {provider.isVerified ? 'Unverify' : 'Verify'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => handleToggle({ isActive: !provider.isActive })}
            >
              {provider.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Link
              href={`/admin/services/providers/${provider.id}/edit`}
              className={cn(buttonVariants({ size: 'sm' }), 'gap-1')}
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Listings', value: providerListings.length, icon: Scissors },
          { label: 'Bookings', value: providerBookings.length, icon: Calendar },
          {
            label: 'Rating',
            value: `${provider.rating.toFixed(1)} (${provider.reviewCount})`,
            icon: Star,
          },
          { label: 'Completed jobs', value: provider.completedJobs, icon: Users },
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
                <p className="truncate text-xl font-bold tabular-nums">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/70 shadow-sm lg:col-span-1">
          <CardHeader className="border-b border-border/60 bg-muted/10 pb-4">
            <CardTitle className="text-base">Provider details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-5 text-sm">
            {provider.bio && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Bio
                </p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{provider.bio}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Contact
              </p>
              {provider.email ? (
                <a
                  href={`mailto:${provider.email}`}
                  className="flex items-center gap-2 text-foreground hover:text-primary"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{provider.email}</span>
                </a>
              ) : (
                <p className="text-muted-foreground">No email</p>
              )}
              {provider.phone ? (
                <a
                  href={buildTelLink(provider.phone)}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {provider.phone}
                </a>
              ) : null}
              {(provider.whatsapp || provider.phone) && (
                <a
                  href={buildWhatsAppLink(provider.whatsapp || provider.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  WhatsApp
                </a>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Location
              </p>
              <p className="mt-1 flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>
                  {[provider.address, provider.city].filter(Boolean).join(', ') || '—'}
                </span>
              </p>
              {provider.serviceAreas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {provider.serviceAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Categories
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categoryNames.length > 0 ? (
                  categoryNames.map((name) => (
                    <span
                      key={name}
                      className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                    >
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">None set</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Mobile service
              </p>
              <p className="mt-1 text-muted-foreground">
                {provider.mobileServiceEnabled
                  ? `${provider.serviceRadiusKm} km radius · ${formatUGX(provider.travelFee)} travel fee`
                  : 'Studio only'}
              </p>
            </div>

            {provider.portfolioImages.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Portfolio
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {provider.portfolioImages.slice(0, 6).map((url) =>
                    isRemoteProductImage(url) ? (
                      <div
                        key={url}
                        className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                      >
                        <Image src={url} alt="" fill className="object-cover" sizes="96px" />
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <p>Joined {formatDate(provider.createdAt)}</p>
              <p className="mt-0.5">Updated {formatDate(provider.updatedAt)}</p>
              <p className="mt-2 font-mono text-[10px] text-muted-foreground/80">{provider.id}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/70 shadow-sm lg:col-span-2">
          <CardHeader className="space-y-4 border-b border-border/60 bg-muted/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Activity</CardTitle>
              {tab === 'services' && (
                <input
                  type="search"
                  placeholder="Search listings…"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:max-w-xs"
                />
              )}
              {tab === 'bookings' && (
                <Link
                  href="/admin/orders?view=services"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open appointment desk
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-xs font-semibold transition sm:text-sm',
                    tab === item.id
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  {item.label}{' '}
                  <span className="tabular-nums opacity-70">({item.count})</span>
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {tab === 'services' &&
              (filteredListings.length === 0 ? (
                <p className="px-6 py-14 text-center text-sm text-muted-foreground">
                  No listings assigned to this provider.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Service</th>
                        <th className="px-4 py-3 font-semibold">Price</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredListings.map((service) => {
                        const cover = resolveListingImage(service, provider);
                        return (
                          <tr
                            key={service.id}
                            className="border-t border-border/60 hover:bg-muted/20"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border/50">
                                  {cover && isRemoteProductImage(cover) ? (
                                    <Image
                                      src={cover}
                                      alt=""
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center">
                                      <Scissors className="h-4 w-4 text-primary/60" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium">{service.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {service.durationMinutes} min · {service.location}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium tabular-nums">
                              {formatUGX(service.basePrice)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                                  service.isArchived
                                    ? 'bg-slate-500/15 text-slate-700'
                                    : service.isActive
                                      ? 'bg-emerald-500/15 text-emerald-800'
                                      : 'bg-amber-500/15 text-amber-800'
                                )}
                              >
                                {service.isArchived
                                  ? 'Archived'
                                  : service.isActive
                                    ? 'Active'
                                    : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href="/admin/services?tab=services"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              >
                                Manage
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

            {tab === 'bookings' &&
              (providerBookings.length === 0 ? (
                <p className="px-6 py-14 text-center text-sm text-muted-foreground">
                  No bookings yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Customer</th>
                        <th className="px-4 py-3 font-semibold">When</th>
                        <th className="px-4 py-3 font-semibold">Total</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providerBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-t border-border/60 hover:bg-muted/20"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/orders?view=services&booking=${encodeURIComponent(booking.id)}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {booking.customerName}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {booking.serviceName}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {booking.date} {booking.timeSlot}
                            <p className="text-xs capitalize text-muted-foreground">
                              {booking.locationType}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-medium tabular-nums">
                            {formatUGX(booking.total || booking.amount || 0)}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={booking.status}
                              onChange={(e) =>
                                updateServiceBookingStatus(
                                  booking.id,
                                  e.target.value as ServiceBookingStatus
                                )
                                  .then(() => toast.success('Status updated'))
                                  .catch((error) =>
                                    toast.error(
                                      error instanceof Error
                                        ? error.message
                                        : 'Could not update'
                                    )
                                  )
                              }
                              className="rounded-lg border px-2 py-1 text-xs"
                            >
                              {BOOKING_STATUSES.map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                  disabled={
                                    status === 'cancelled' && booking.paymentStatus === 'paid'
                                  }
                                >
                                  {status.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {tab === 'reviews' &&
              (providerReviews.length === 0 ? (
                <p className="px-6 py-14 text-center text-sm text-muted-foreground">
                  No reviews yet.
                </p>
              ) : (
                <div className="divide-y divide-border/60">
                  {providerReviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex flex-wrap items-start justify-between gap-4 px-4 py-4"
                    >
                      <div>
                        <p className="font-medium">
                          {review.customerName} · ★ {review.rating}
                        </p>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {review.isVisible ? 'Visible' : 'Hidden'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateServiceReviewVisibility(review.id, !review.isVisible).then(() =>
                              toast.success('Updated')
                            )
                          }
                        >
                          {review.isVisible ? 'Hide' : 'Show'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Delete review?')) {
                              deleteServiceReview(review.id).then(() => toast.success('Deleted'));
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {tab === 'availability' && (
              <div className="space-y-5 p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Slot duration</p>
                    <p className="text-xs text-muted-foreground">
                      Used when generating bookable times.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={15}
                      step={15}
                      defaultValue={avail?.slotDurationMinutes ?? 60}
                      className="h-9 w-24"
                      onBlur={(e) => {
                        const next = Number(e.target.value) || 60;
                        if (next !== (avail?.slotDurationMinutes ?? 60)) {
                          void handleSlotDuration(next);
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">minutes</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {WEEKDAYS.map((day) => {
                    const ranges = avail?.weeklySlots?.[day] ?? [];
                    const open = ranges.length > 0;
                    const range = ranges[0] ?? { start: '09:00', end: '18:00' };
                    return (
                      <div
                        key={day}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5"
                      >
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleToggleDay(day)}
                          className={cn(
                            'w-24 rounded-lg px-2 py-1 text-left text-sm font-medium',
                            open ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {weekdayLabel(day)}
                        </button>
                        {open ? (
                          <div className="flex items-center gap-2">
                            <input
                              key={`${day}-start-${range.start}`}
                              type="time"
                              defaultValue={range.start}
                              className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                              onBlur={(e) => handleDayHours(day, e.target.value, range.end)}
                            />
                            <span className="text-xs text-muted-foreground">to</span>
                            <input
                              key={`${day}-end-${range.end}`}
                              type="time"
                              defaultValue={range.end}
                              className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                              onBlur={(e) => handleDayHours(day, range.start, e.target.value)}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Blackout dates</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(avail?.blackoutDates ?? []).map((date) => (
                      <button
                        key={date}
                        type="button"
                        onClick={() => handleRemoveBlackout(date)}
                        className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground hover:border-rose-300 hover:text-rose-700"
                      >
                        {date} ×
                      </button>
                    ))}
                    {(avail?.blackoutDates ?? []).length === 0 && (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={blackoutDraft}
                      onChange={(e) => setBlackoutDraft(e.target.value)}
                      className="h-9 max-w-[12rem]"
                    />
                    <Button size="sm" variant="outline" disabled={busy} onClick={handleAddBlackout}>
                      Add date
                    </Button>
                  </div>
                </div>

                <Button size="sm" variant="outline" disabled={busy} onClick={handleResetAvailability}>
                  Reset to default hours (Mon–Sat)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
