'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { subscribeServiceCategories } from '@/lib/firebase/service-categories';
import { subscribeServiceProviders } from '@/lib/firebase/service-providers';
import { subscribeServiceListings } from '@/lib/firebase/service-listings';
import { subscribeServiceBookings } from '@/lib/firebase/service-bookings';
import { subscribeServiceReviews } from '@/lib/firebase/service-reviews';
import { subscribeProviderAvailability } from '@/lib/firebase/provider-availability';
import { SERVICE_CATALOG } from '@/lib/service-catalog';
import { isProviderPubliclyVisible } from '@/lib/provider-visibility';
import { readCatalogCache, writeCatalogCache } from '@/lib/catalog-cache';
import type {
  ProviderAvailability,
  ServiceBooking,
  ServiceCategory,
  ServiceListing,
  ServiceProvider,
  ServiceReview,
} from '@/lib/types/services';

interface ServicesContextValue {
  categories: ServiceCategory[];
  providers: ServiceProvider[];
  listings: ServiceListing[];
  bookings: ServiceBooking[];
  reviews: ServiceReview[];
  availability: ProviderAvailability[];
  loading: boolean;
  activeCategories: ServiceCategory[];
  activeListings: ServiceListing[];
  activeProviders: ServiceProvider[];
}

const ServicesContext = createContext<ServicesContextValue | null>(null);

function catalogFallbackCategories(): ServiceCategory[] {
  const now = new Date();
  return SERVICE_CATALOG.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    serviceTypes: c.serviceTypes,
    sortOrder: c.sortOrder,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));
}

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [availability, setAvailability] = useState<ProviderAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState({ categories: false, providers: false, listings: false });

  useEffect(() => {
    const cachedCategories = readCatalogCache<ServiceCategory>('service-categories');
    const cachedProviders = readCatalogCache<ServiceProvider>('service-providers');
    const cachedListings = readCatalogCache<ServiceListing>('service-listings');
    if (cachedCategories?.length) setCategories(cachedCategories);
    if (cachedProviders?.length) setProviders(cachedProviders);
    if (cachedListings?.length) setListings(cachedListings);
    if (cachedCategories?.length && cachedListings?.length) {
      setReady({ categories: true, providers: true, listings: true });
      setLoading(false);
    }

    const unsubs: Array<() => void> = [
      subscribeServiceCategories((data) => {
        const next = data.length > 0 ? data : catalogFallbackCategories();
        setCategories(next);
        writeCatalogCache('service-categories', next);
        setReady((r) => ({ ...r, categories: true }));
      }),
      subscribeServiceProviders((data) => {
        setProviders(data);
        writeCatalogCache('service-providers', data);
        setReady((r) => ({ ...r, providers: true }));
      }),
      subscribeServiceListings((data) => {
        setListings(data);
        writeCatalogCache('service-listings', data);
        setReady((r) => ({ ...r, listings: true }));
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, []);

  useEffect(() => {
    const needsExtras =
      pathname.startsWith('/services') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/account');
    if (!needsExtras) return;

    const unsubs: Array<() => void> = [
      subscribeServiceReviews(setReviews),
      subscribeProviderAvailability(setAvailability),
    ];
    return () => unsubs.forEach((u) => u());
  }, [pathname]);

  useEffect(() => {
    if (!isAdmin) {
      setBookings([]);
      return;
    }
    return subscribeServiceBookings(setBookings);
  }, [isAdmin]);

  useEffect(() => {
    if (ready.categories && ready.providers && ready.listings) {
      setLoading(false);
    }
  }, [ready]);

  const value = useMemo<ServicesContextValue>(() => {
    const activeCategories = categories.filter((c) => c.isActive);
    const activeProviders = providers.filter((p) => isProviderPubliclyVisible(p));
    const visibleProviderIds = new Set(activeProviders.map((p) => p.id));
    const activeListings = listings.filter(
      (l) => l.isActive && !l.isArchived && visibleProviderIds.has(l.providerId)
    );
    return {
      categories,
      providers,
      listings,
      bookings,
      reviews,
      availability,
      loading,
      activeCategories,
      activeListings,
      activeProviders,
    };
  }, [categories, providers, listings, bookings, reviews, availability, loading]);

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used within ServicesProvider');
  return ctx;
}
