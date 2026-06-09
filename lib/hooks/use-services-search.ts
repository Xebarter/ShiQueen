'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { filterServices, pricePresetToRange } from '@/lib/services-utils';
import type {
  ServicePricePreset,
  ServiceSearchFilters,
  ServiceSortMode,
} from '@/lib/types/services';
import { useServices } from '@/lib/services-context';

const VALID_SORTS: ServiceSortMode[] = [
  'popular',
  'trending',
  'newest',
  'rating',
  'price_asc',
  'price_desc',
];

const VALID_PRICE_PRESETS: ServicePricePreset[] = [
  'all',
  'under-100k',
  '100k-300k',
  '300k-plus',
];

function parseSort(value: string | null): ServiceSortMode {
  if (value && VALID_SORTS.includes(value as ServiceSortMode)) {
    return value as ServiceSortMode;
  }
  return 'popular';
}

function parsePricePreset(value: string | null): ServicePricePreset {
  if (value && VALID_PRICE_PRESETS.includes(value as ServicePricePreset)) {
    return value as ServicePricePreset;
  }
  return 'all';
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function useServicesSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeListings, activeProviders, activeCategories } = useServices();

  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [city, setCity] = useState(() => searchParams.get('city') ?? '');
  const [categoryId, setCategoryId] = useState(() => searchParams.get('category') ?? '');
  const [sort, setSort] = useState<ServiceSortMode>(() => parseSort(searchParams.get('sort')));
  const [pricePreset, setPricePreset] = useState<ServicePricePreset>(() =>
    parsePricePreset(searchParams.get('price'))
  );
  const [minRating, setMinRating] = useState(() => {
    const r = searchParams.get('rating');
    return r ? Number(r) : 0;
  });
  const [mobileOnly, setMobileOnly] = useState(() => searchParams.get('mobile') === '1');
  const [inStudioOnly, setInStudioOnly] = useState(() => searchParams.get('studio') === '1');

  const debouncedQuery = useDebouncedValue(query, 300);
  const debouncedCity = useDebouncedValue(city, 300);

  const priceRange = useMemo(() => pricePresetToRange(pricePreset), [pricePreset]);

  const filters: ServiceSearchFilters = useMemo(
    () => ({
      query: debouncedQuery,
      categoryId: categoryId || undefined,
      city: debouncedCity,
      priceMin: priceRange.priceMin,
      priceMax: priceRange.priceMax,
      minRating: minRating > 0 ? minRating : undefined,
      mobileOnly: mobileOnly || undefined,
      inStudioOnly: inStudioOnly || undefined,
      sort,
    }),
    [
      debouncedQuery,
      categoryId,
      debouncedCity,
      priceRange,
      minRating,
      mobileOnly,
      inStudioOnly,
      sort,
    ]
  );

  const results = useMemo(
    () => filterServices(activeListings, activeProviders, activeCategories, filters),
    [activeListings, activeProviders, activeCategories, filters]
  );

  const hasActiveFilters = Boolean(
    debouncedQuery.trim() ||
      categoryId ||
      debouncedCity.trim() ||
      pricePreset !== 'all' ||
      minRating > 0 ||
      mobileOnly ||
      inStudioOnly ||
      sort !== 'popular'
  );

  const activeFilterCount = [
    categoryId,
    pricePreset !== 'all' ? pricePreset : '',
    minRating > 0 ? 'rating' : '',
    mobileOnly ? 'mobile' : '',
    inStudioOnly ? 'studio' : '',
    sort !== 'popular' ? sort : '',
  ].filter(Boolean).length;

  const lastSyncedRef = useRef(searchParams.toString());

  const buildParamsString = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
    if (categoryId) params.set('category', categoryId);
    if (debouncedCity.trim()) params.set('city', debouncedCity.trim());
    if (sort !== 'popular') params.set('sort', sort);
    if (pricePreset !== 'all') params.set('price', pricePreset);
    if (minRating > 0) params.set('rating', String(minRating));
    if (mobileOnly) params.set('mobile', '1');
    if (inStudioOnly) params.set('studio', '1');
    return params.toString();
  }, [
    debouncedQuery,
    categoryId,
    debouncedCity,
    sort,
    pricePreset,
    minRating,
    mobileOnly,
    inStudioOnly,
  ]);

  useEffect(() => {
    const next = buildParamsString();
    if (next === lastSyncedRef.current) return;
    lastSyncedRef.current = next;
    router.replace(next ? `/services?${next}` : '/services', { scroll: false });
  }, [buildParamsString, router]);

  useEffect(() => {
    const current = searchParams.toString();
    if (current === lastSyncedRef.current) return;
    lastSyncedRef.current = current;
    setQuery(searchParams.get('q') ?? '');
    setCity(searchParams.get('city') ?? '');
    setCategoryId(searchParams.get('category') ?? '');
    setSort(parseSort(searchParams.get('sort')));
    setPricePreset(parsePricePreset(searchParams.get('price')));
    const r = searchParams.get('rating');
    setMinRating(r ? Number(r) : 0);
    setMobileOnly(searchParams.get('mobile') === '1');
    setInStudioOnly(searchParams.get('studio') === '1');
  }, [searchParams]);

  const clearAllFilters = useCallback(() => {
    setQuery('');
    setCity('');
    setCategoryId('');
    setSort('popular');
    setPricePreset('all');
    setMinRating(0);
    setMobileOnly(false);
    setInStudioOnly(false);
  }, []);

  const patchFilters = useCallback(
    (patch: {
      categoryId?: string;
      sort?: ServiceSortMode;
      pricePreset?: ServicePricePreset;
      minRating?: number;
      mobileOnly?: boolean;
      inStudioOnly?: boolean;
    }) => {
      if (patch.categoryId !== undefined) setCategoryId(patch.categoryId);
      if (patch.sort !== undefined) setSort(patch.sort);
      if (patch.pricePreset !== undefined) setPricePreset(patch.pricePreset);
      if (patch.minRating !== undefined) setMinRating(patch.minRating);
      if (patch.mobileOnly !== undefined) setMobileOnly(patch.mobileOnly);
      if (patch.inStudioOnly !== undefined) setInStudioOnly(patch.inStudioOnly);
    },
    []
  );

  return {
    query,
    setQuery,
    city,
    setCity,
    categoryId,
    setCategoryId,
    sort,
    setSort,
    pricePreset,
    setPricePreset,
    minRating,
    setMinRating,
    mobileOnly,
    setMobileOnly,
    inStudioOnly,
    setInStudioOnly,
    filters,
    results,
    hasActiveFilters,
    activeFilterCount,
    clearAllFilters,
    patchFilters,
    filterState: {
      categoryId,
      sort,
      pricePreset,
      minRating,
      mobileOnly,
      inStudioOnly,
    },
  };
}
