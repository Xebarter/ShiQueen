'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { subscribeServiceCategories } from '@/lib/firebase/service-categories';
import { subscribeServiceProviders } from '@/lib/firebase/service-providers';
import { subscribeServiceListings } from '@/lib/firebase/service-listings';
import { subscribeServiceBookings } from '@/lib/firebase/service-bookings';
import { subscribeServiceReviews } from '@/lib/firebase/service-reviews';
import { subscribeProviderAvailability } from '@/lib/firebase/provider-availability';
import { SERVICE_CATALOG } from '@/lib/service-catalog';
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
    const unsubs: Array<() => void> = [
      subscribeServiceCategories((data) => {
        setCategories(data.length > 0 ? data : catalogFallbackCategories());
        setReady((r) => ({ ...r, categories: true }));
      }),
      subscribeServiceProviders((data) => {
        setProviders(data);
        setReady((r) => ({ ...r, providers: true }));
      }),
      subscribeServiceListings((data) => {
        setListings(data);
        setReady((r) => ({ ...r, listings: true }));
      }),
      subscribeServiceReviews(setReviews),
      subscribeProviderAvailability(setAvailability),
    ];

    if (isAdmin) {
      unsubs.push(subscribeServiceBookings(setBookings));
    } else {
      setBookings([]);
    }

    return () => unsubs.forEach((u) => u());
  }, [isAdmin]);

  useEffect(() => {
    if (ready.categories && ready.providers && ready.listings) {
      setLoading(false);
    }
  }, [ready]);

  const value = useMemo<ServicesContextValue>(() => {
    const activeCategories = categories.filter((c) => c.isActive);
    const activeListings = listings.filter((l) => l.isActive && !l.isArchived);
    const activeProviders = providers.filter((p) => p.isActive);
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
