'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PackageHeroCarousel } from '@/components/packages/discovery/package-hero-carousel';
import {
  PackageSearchBar,
  type PackageSearchSuggestion,
} from '@/components/packages/discovery/package-search-bar';
import { PackageDiscoveryCategories } from '@/components/packages/discovery/package-discovery-categories';
import { PackageFomoSections } from '@/components/packages/discovery/package-fomo-sections';
import { PackageCuratedCollections } from '@/components/packages/discovery/package-curated-collections';
import { PackageRecommendationSections } from '@/components/packages/discovery/package-recommendation-sections';
import {
  PackageBrowseSection,
  type CategoryFilter,
  type SortOption,
} from '@/components/packages/discovery/package-browse-section';
import { PackageTrustStrip } from '@/components/packages/discovery/package-trust-strip';
import { PackageCompareStrip } from '@/components/packages/package-compare-strip';
import { PackageQuickViewModal } from '@/components/packages/package-quick-view-modal';
import { PackageQuizModal, type PackageQuizResult } from '@/components/packages/package-quiz-modal';
import { PackageMobileActionBar } from '@/components/packages/package-mobile-action-bar';
import { useWholesale } from '@/lib/wholesale-context';
import { useCart } from '@/lib/cart-context';
import { usePublicProducts, usePublicPackages } from '@/lib/hooks/use-public-catalog';
import { useServices } from '@/lib/services-context';
import {
  buildPackageCatalogMaps,
  getPackageCoverImages,
  getPackageImage,
  resolvePackageSavings,
} from '@/lib/package-utils';
import { createPackageSearchIndex } from '@/lib/package-search';
import {
  getFeaturedHeroPackages,
  getTrendingPackages,
  getBestDealsToday,
  getSignaturePackages,
  getNewArrivals,
  getLuxuryTierLadder,
  getRecommendedPackages,
  getUpgradePackages,
  getStoredViewedPackageIds,
  trackPackageView,
} from '@/lib/package-merchandising';
import {
  filterPackagesByCollection,
  getPackageCollection,
} from '@/lib/package-collections';
import { PACKAGE_CATEGORIES, type PackageCategoryId } from '@/lib/package-catalog';
import type { Package } from '@/lib/types/wholesale';

export function PackagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelectedPackage } = useWholesale();
  const { packages, loading } = usePublicPackages();
  const { addItem, itemCount } = useCart();
  const { products } = usePublicProducts();
  const { activeListings } = useServices();

  const activePackages = useMemo(() => packages, [packages]);
  const { productNames, retailPrices } = useMemo(
    () => buildPackageCatalogMaps(products, activeListings, activePackages),
    [activePackages, products, activeListings]
  );

  const packageIndex = useMemo(
    () => createPackageSearchIndex(activePackages, productNames),
    [activePackages, productNames]
  );

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('savings');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | undefined>();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quickViewPkg, setQuickViewPkg] = useState<Package | null>(null);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hydratedQuery = useRef(false);

  useEffect(() => {
    setViewedIds(getStoredViewedPackageIds());
  }, []);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && PACKAGE_CATEGORIES.some((c) => c.id === category)) {
      setCategoryFilter(category as PackageCategoryId);
    }
    const collection = searchParams.get('collection');
    if (collection) {
      setCollectionId(collection);
    }
    if (!hydratedQuery.current) {
      hydratedQuery.current = true;
      const q = searchParams.get('q');
      if (q) setSearch(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const next = search.trim();
      if (next) params.set('q', next);
      else params.delete('q');
      const qs = params.toString();
      const href = qs ? `/packages?${qs}` : '/packages';
      if (`${window.location.pathname}${window.location.search}` !== href) {
        router.replace(href, { scroll: false });
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [search, router, searchParams]);

  const isSearchMode = search.trim().length > 0;

  const heroPackages = useMemo(
    () => getFeaturedHeroPackages(activePackages, retailPrices, 5),
    [activePackages, retailPrices]
  );

  const trending = useMemo(
    () => getTrendingPackages(activePackages, retailPrices, 8),
    [activePackages, retailPrices]
  );

  const bestDeals = useMemo(
    () => getBestDealsToday(activePackages, retailPrices, 8),
    [activePackages, retailPrices]
  );

  const signatures = useMemo(() => getSignaturePackages(activePackages, 8), [activePackages]);

  const newArrivals = useMemo(() => getNewArrivals(activePackages, 8), [activePackages]);

  const luxuryLadder = useMemo(
    () => getLuxuryTierLadder(activePackages, retailPrices).slice(0, 3),
    [activePackages, retailPrices]
  );

  const recommended = useMemo(
    () => getRecommendedPackages(activePackages, viewedIds, retailPrices, 8),
    [activePackages, viewedIds, retailPrices]
  );

  const upgradeFrom = heroPackages[0] ?? null;
  const upgrades = useMemo(
    () =>
      upgradeFrom ? getUpgradePackages(upgradeFrom, activePackages, retailPrices, 6) : [],
    [upgradeFrom, activePackages, retailPrices]
  );

  const rankedHits = useMemo(() => {
    const term = search.trim();
    if (!term) return null;
    return packageIndex.search(term, 80);
  }, [packageIndex, search]);

  const filteredPackages = useMemo(() => {
    let result = rankedHits
      ? rankedHits.map((hit) => hit.pkg)
      : activePackages.filter((pkg) => pkg.isActive);

    if (collectionId) {
      result = filterPackagesByCollection(result, collectionId, retailPrices);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    if (maxPriceFilter) {
      result = result.filter(
        (p) => resolvePackageSavings(p, retailPrices).packagePrice <= maxPriceFilter
      );
    }

    const preserveRelevance = Boolean(rankedHits) && sort === 'relevance';
    if (preserveRelevance) return result;

    return [...result].sort((a, b) => {
      const savingsA = resolvePackageSavings(a, retailPrices);
      const savingsB = resolvePackageSavings(b, retailPrices);
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return savingsA.packagePrice - savingsB.packagePrice;
        case 'price-high':
          return savingsB.packagePrice - savingsA.packagePrice;
        case 'savings':
          return savingsB.savingsPercentage - savingsA.savingsPercentage;
        default:
          return 0;
      }
    });
  }, [
    activePackages,
    rankedHits,
    collectionId,
    categoryFilter,
    maxPriceFilter,
    sort,
    retailPrices,
  ]);

  const suggestions: PackageSearchSuggestion[] = useMemo(() => {
    if (!rankedHits) return [];
    return rankedHits.slice(0, 6).map((hit) => ({
      id: hit.pkg.id,
      name: hit.pkg.name,
      tagline: hit.pkg.tagline,
      price: resolvePackageSavings(hit.pkg, retailPrices).packagePrice,
      image: getPackageCoverImages(hit.pkg, products, activeListings)[0],
    }));
  }, [rankedHits, retailPrices, products, activeListings]);

  const collectionTitle = collectionId
    ? getPackageCollection(collectionId)?.title
    : undefined;

  const handleAddToCart = useCallback(
    (pkg: Package, e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      const { packagePrice } = resolvePackageSavings(pkg, retailPrices);
      setSelectedPackage(pkg);
      addItem({
        id: pkg.id,
        name: pkg.name,
        price: packagePrice,
        image: getPackageImage(pkg, products, activeListings),
        quantity: 1,
      });
      trackPackageView(pkg.id);
      setViewedIds(getStoredViewedPackageIds());
      toast.success('Collection added to cart');
    },
    [addItem, activeListings, products, retailPrices, setSelectedPackage]
  );

  const handleQuickView = useCallback((pkg: Package) => {
    trackPackageView(pkg.id);
    setViewedIds(getStoredViewedPackageIds());
    setQuickViewPkg(pkg);
  }, []);

  const scrollToBrowse = useCallback(() => {
    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const focusPackageSearch = useCallback(() => {
    const el = document.getElementById('package-search');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => searchInputRef.current?.focus(), 350);
  }, []);

  const scrollToDeals = useCallback(() => {
    document.getElementById('deals-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleCategorySelect = useCallback(
    (id: PackageCategoryId) => {
      setCategoryFilter(id);
      setCollectionId(null);
      setTimeout(scrollToBrowse, 80);
    },
    [scrollToBrowse]
  );

  const handleCollectionSelect = useCallback(
    (id: string) => {
      setCollectionId(id);
      setCategoryFilter('all');
      setTimeout(scrollToBrowse, 80);
    },
    [scrollToBrowse]
  );

  const handleQuizComplete = useCallback(
    (result: PackageQuizResult) => {
      if (result.category) setCategoryFilter(result.category);
      setCollectionId(null);
      setMaxPriceFilter(result.maxPrice);
      setSort(result.sort === 'savings' ? 'savings' : result.sort);
      toast.success('Here is an edit composed for you');
      setTimeout(scrollToBrowse, 200);
    },
    [scrollToBrowse]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (value.trim() && sort !== 'relevance') {
      setSort('relevance');
    }
    if (!value.trim() && sort === 'relevance') {
      setSort('savings');
    }
  }, [sort]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setCategoryFilter('all');
    setCollectionId(null);
    setMaxPriceFilter(undefined);
    setSort('savings');
  }, []);

  const fomoRows = [
    {
      title: 'Signature collections',
      subtitle: 'The house edit — composed, complete, and exclusive',
      urgency: 'Atelier',
      packages: signatures.length > 0 ? signatures : newArrivals,
    },
    {
      title: 'Most sought this week',
      subtitle: 'What queens are choosing right now',
      urgency: 'In demand',
      packages: trending,
      trending: true,
    },
    {
      title: 'Best value',
      subtitle: 'The strongest savings against buying separately',
      packages: bestDeals,
    },
  ];

  const browseSection = (
    <PackageBrowseSection
      loading={loading}
      packages={filteredPackages}
      products={products}
      retailPrices={retailPrices}
      search={search}
      sort={sort}
      categoryFilter={categoryFilter}
      collectionTitle={collectionTitle}
      maxPriceFilter={maxPriceFilter}
      filtersExpanded={filtersExpanded}
      onSortChange={setSort}
      onCategoryChange={(v) => {
        setCategoryFilter(v);
        setCollectionId(null);
      }}
      onMaxPriceChange={setMaxPriceFilter}
      onFiltersExpandedChange={setFiltersExpanded}
      onClearFilters={clearFilters}
      onQuickView={handleQuickView}
      onAddToCart={handleAddToCart}
    />
  );

  return (
    <>
      <Header />
      <main className="overflow-x-clip mobile-scroll-optimize bg-background pb-20 sm:pb-0">
        {!isSearchMode && (
          <PackageHeroCarousel
            packages={heroPackages}
            products={products}
            retailPrices={retailPrices}
            onShopPackages={scrollToBrowse}
            onFindPerfect={() => setQuizOpen(true)}
          />
        )}

        <PackageSearchBar
          ref={searchInputRef}
          search={search}
          totalPackages={activePackages.length}
          resultCount={filteredPackages.length}
          suggestions={suggestions}
          onSearchChange={handleSearchChange}
          onClear={() => handleSearchChange('')}
          onViewAllResults={scrollToBrowse}
          onSelectSuggestion={(id) => router.push(`/packages/${id}`)}
        />

        {isSearchMode ? (
          browseSection
        ) : (
          <>
            <PackageDiscoveryCategories
              packages={activePackages}
              products={products}
              selectedCategory={categoryFilter}
              onSelectCategory={handleCategorySelect}
            />

            <div id="deals-section">
              <PackageFomoSections
                rows={fomoRows}
                products={products}
                retailPrices={retailPrices}
                onQuickView={handleQuickView}
                onAddToCart={handleAddToCart}
              />
            </div>

            <PackageCuratedCollections onSelectCollection={handleCollectionSelect} />

            <PackageCompareStrip
              packages={luxuryLadder}
              products={products}
              retailPrices={retailPrices}
              onAddToCart={handleAddToCart}
            />

            <PackageRecommendationSections
              recommended={recommended}
              upgradeFrom={upgradeFrom}
              upgrades={upgrades}
              products={products}
              retailPrices={retailPrices}
              onQuickView={handleQuickView}
              onAddToCart={handleAddToCart}
            />

            {browseSection}
          </>
        )}

        <PackageTrustStrip />
      </main>
      <Footer />

      <PackageQuickViewModal
        pkg={quickViewPkg}
        products={products}
        productNames={productNames}
        retailPrices={retailPrices}
        onClose={() => setQuickViewPkg(null)}
        onAddToCart={(pkg) => handleAddToCart(pkg)}
      />

      <PackageQuizModal
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        onComplete={handleQuizComplete}
      />

      <PackageMobileActionBar
        cartCount={itemCount}
        onSearch={focusPackageSearch}
        onDeals={isSearchMode ? scrollToBrowse : scrollToDeals}
        onBrowse={scrollToBrowse}
      />
    </>
  );
}
