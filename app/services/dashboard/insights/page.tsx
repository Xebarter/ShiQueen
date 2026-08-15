'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  ClipboardList,
  Loader2,
  MapPin,
  Plus,
  Scissors,
  Star,
} from 'lucide-react';
import { ProviderShell } from '@/components/provider/provider-shell';
import { ApprovedActionLink } from '@/components/partner/approved-action-link';
import {
  PartnerCard,
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
  PartnerSectionLabel,
  PartnerStatCard,
  PartnerStatusPill,
} from '@/components/partner/partner-page';
import {
  AnalyticsChartCard,
  AnalyticsMetricCard,
  RankedList,
  RevenueTrendChart,
  SharePieChart,
  SimpleBarChart,
  StatusFunnelBars,
} from '@/components/analytics/charts';
import {
  computeBookingKeyMetrics,
  computeBookingMonthlyTrend,
  computeBookingStatusFunnel,
  computeBookingsByWeekday,
  computeListingPerformance,
  computeLocationMix,
} from '@/lib/analytics/compute';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';
import { subscribeServiceBookingsForProvider } from '@/lib/firebase/service-bookings';
import type { ServiceBooking } from '@/lib/types/services';
import { canListCatalog } from '@/lib/partner-status';
import { formatUGX } from '@/lib/wholesale-data';

function bookingTone(status: ServiceBooking['status']) {
  if (status === 'in_progress') return 'progress' as const;
  return status;
}

export default function ProviderInsightsPage() {
  const { providerId } = useAuth();
  const { providers, listings, loading: servicesLoading } = useServices();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const provider = providers.find((p) => p.id === providerId);
  const allowed = canListCatalog(provider?.approvalStatus, provider?.isActive);

  const mine = useMemo(
    () => listings.filter((l) => l.providerId === providerId && !l.isArchived),
    [listings, providerId]
  );

  useEffect(() => {
    if (!providerId) {
      setBookingsLoading(false);
      return;
    }
    setBookingsLoading(true);
    return subscribeServiceBookingsForProvider(
      providerId,
      (next) => {
        setBookings(next);
        setBookingsLoading(false);
      },
      () => setBookingsLoading(false)
    );
  }, [providerId]);

  const metrics = useMemo(() => computeBookingKeyMetrics(bookings), [bookings]);
  const monthlyTrend = useMemo(() => computeBookingMonthlyTrend(bookings), [bookings]);
  const funnel = useMemo(() => computeBookingStatusFunnel(bookings), [bookings]);
  const listingPerf = useMemo(
    () => computeListingPerformance(bookings, mine),
    [bookings, mine]
  );
  const locationMix = useMemo(() => computeLocationMix(bookings), [bookings]);
  const weekdayBookings = useMemo(() => computeBookingsByWeekday(bookings), [bookings]);
  const recent = bookings.slice(0, 6);

  const loading = servicesLoading || bookingsLoading;

  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Performance"
          title="Insights"
          description={[provider?.businessName || 'Your studio', provider?.city]
            .filter(Boolean)
            .join(' · ')}
          action={
            <ApprovedActionLink allowed={allowed} href="/services/dashboard/listings/new">
              <Plus className="h-4 w-4" />
              Add listing
            </ApprovedActionLink>
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !providerId ? (
          <PartnerEmptyState
            icon={Scissors}
            title="Provider profile required"
            description="Finish onboarding to unlock booking analytics for your studio."
          />
        ) : (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AnalyticsMetricCard
                title="Earnings this month"
                value={formatUGX(metrics.thisMonthEarnings)}
                change={metrics.earningsChange}
                hint={`${formatUGX(metrics.allTimeEarnings)} completed all-time`}
              />
              <AnalyticsMetricCard
                title="Bookings this month"
                value={String(metrics.thisMonthBookings)}
                change={metrics.bookingsChange}
                hint={`${metrics.thisWeekBookings} this week (${metrics.weekChange >= 0 ? '+' : ''}${metrics.weekChange.toFixed(0)}%)`}
              />
              <AnalyticsMetricCard
                title="Avg booking value"
                value={formatUGX(metrics.averageBookingValue)}
                change={metrics.abvChange}
              />
              <AnalyticsMetricCard
                title="Completion rate"
                value={`${metrics.completionRate.toFixed(1)}%`}
                hint={`${metrics.pendingCount} pending · ${metrics.paymentSuccessRate.toFixed(1)}% paid`}
              />
            </div>

            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PartnerStatCard
                label="Listings"
                value={mine.length}
                href="/services/dashboard/listings"
                icon={Scissors}
              />
              <PartnerStatCard
                label="This week"
                value={metrics.thisWeekBookings}
                href="/services/dashboard/bookings"
                icon={ClipboardList}
              />
              <PartnerStatCard
                label="Completed"
                value={bookings.filter((b) => b.status === 'completed').length}
                href="/services/dashboard/bookings"
                icon={CalendarClock}
              />
              <PartnerStatCard
                label="Rating"
                value={provider?.rating?.toFixed(1) ?? '—'}
                href="/services/dashboard/reviews"
                icon={Star}
              />
            </div>

            <div className="mb-6">
              <AnalyticsChartCard
                title="Earnings trend"
                description="Completed earnings and booking volume over the last 6 months"
              >
                <RevenueTrendChart
                  data={monthlyTrend.map((r) => ({
                    label: r.label,
                    revenue: r.earnings,
                    orders: r.bookings,
                  }))}
                  secondaryKey="orders"
                  secondaryLabel="Bookings"
                />
              </AnalyticsChartCard>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AnalyticsChartCard
                title="Booking pipeline"
                description="Where appointments sit in the lifecycle"
              >
                <StatusFunnelBars items={funnel} />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Studio vs mobile"
                description="How clients prefer to book with you"
                action={<MapPin className="h-4 w-4 text-primary" />}
              >
                <SharePieChart
                  data={locationMix.map((m) => ({ name: m.label, value: m.count }))}
                />
              </AnalyticsChartCard>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AnalyticsChartCard
                title="Busy days"
                description="Bookings by scheduled weekday"
              >
                <SimpleBarChart
                  data={weekdayBookings.map((d) => ({
                    label: d.day,
                    bookings: d.bookings,
                  }))}
                  dataKey="bookings"
                  color="var(--chart-2)"
                />
              </AnalyticsChartCard>

              <AnalyticsChartCard
                title="Listing performance"
                description="Ranked by completed earnings, with views and conversion"
              >
                <RankedList
                  items={listingPerf.map((l) => ({
                    id: l.listingId,
                    title: l.name,
                    subtitle: `${l.bookings} bookings · ${l.views} views · ${l.conversionRate.toFixed(1)}% conv.`,
                    value: formatUGX(l.earnings),
                    meta: l.rating ? `★ ${l.rating.toFixed(1)}` : undefined,
                  }))}
                  emptyMessage="Add listings and take bookings to see performance."
                />
              </AnalyticsChartCard>
            </div>

            {recent.length > 0 && (
              <section>
                <PartnerSectionLabel>Recent bookings</PartnerSectionLabel>
                <PartnerCard>
                  {recent.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/services/dashboard/bookings/${booking.id}`}
                      className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0 transition hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{booking.serviceName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {booking.customerName} · {booking.date} {booking.timeSlot} ·{' '}
                          {formatUGX(booking.total)}
                        </p>
                      </div>
                      <PartnerStatusPill tone={bookingTone(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </PartnerStatusPill>
                    </Link>
                  ))}
                </PartnerCard>
              </section>
            )}
          </>
        )}
      </PartnerPage>
    </ProviderShell>
  );
}
