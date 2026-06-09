'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PackageHeroCarousel } from '@/components/packages/discovery/package-hero-carousel';
import { PackageSearchBar } from '@/components/packages/discovery/package-search-bar';
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
import { useProducts } from '@/lib/products-context';
import {
  getProductNameMap,
  getRetailPricesMap,
  productsToCatalog,
} from '@/lib/wholesale-data';
import {
  getPackageImage,
  getPackageItemName,
  mergePackageItemMaps,
  resolvePackageSavings,
} from '@/lib/package-utils';
import {
  getFeaturedHeroPackages,
  getTrendingPackages,
  getBestDealsToday,
  getMostLovedPackages,
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
  const searchParams = useSearchParams();
  const { packages, setSelectedPackage, loading } = useWholesale();
  const { addItem, itemCount } = useCart();
  const { products } = useProducts();
  const catalog = productsToCatalog(products);

  const activePackages = useMemo(() => packages.filter((p) => p.isActive), [packages]);
  const { productNames, retailPrices } = useMemo(
    () =>
      mergePackageItemMaps(
        activePackages,
        getProductNameMap(catalog),
        getRetailPricesMap(catalog)
      ),
    [activePackages, catalog]
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
  }, [searchParams]);

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

  const mostLoved = useMemo(
    () => getMostLovedPackages(activePackages, retailPrices, 8),
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
      upgradeFrom
        ? getUpgradePackages(upgradeFrom, activePackages, retailPrices, 6)
        : [],
    [upgradeFrom, activePackages, retailPrices]
  );

  const filteredPackages = useMemo(() => {
    const term = search.toLowerCase().trim();
    let result = activePackages;

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

    if (term) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          (p.tagline ?? '').toLowerCase().includes(term) ||
          (p.highlights ?? []).some((h) => h.toLowerCase().includes(term)) ||
          p.items.some((item) =>
            getPackageItemName(item, productNames).toLowerCase().includes(term)
          )
      );
    }

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
        default:
          return savingsB.savingsPercentage - savingsA.savingsPercentage;
      }
    });
  }, [
    activePackages,
    collectionId,
    categoryFilter,
    maxPriceFilter,
    search,
    sort,
    retailPrices,
    productNames,
  ]);

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
        image: getPackageImage(pkg, products),
        quantity: 1,
      });
      trackPackageView(pkg.id);
      setViewedIds(getStoredViewedPackageIds());
      toast.success('Bundle added to cart!');
    },
    [addItem, products, retailPrices, setSelectedPackage]
  );

  const handleQuickView = useCallback((pkg: Package) => {
    trackPackageView(pkg.id);
    setViewedIds(getStoredViewedPackageIds());
    setQuickViewPkg(pkg);
  }, []);

  const scrollToBrowse = useCallback(() => {
    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const focusPackageSearch = useCallback(() => {
    const el = document.getElementById('package-search');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => searchInputRef.current?.focus(), 350);
  }, []);

  const handlePackageSearchSubmit = useCallback(() => {
    scrollToBrowse();
  }, [scrollToBrowse]);

  const scrollToDeals = useCallback(() => {
    document.getElementById('deals-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleCategorySelect = useCallback((id: PackageCategoryId) => {
    setCategoryFilter(id);
    setCollectionId(null);
    setTimeout(scrollToBrowse, 100);
  }, [scrollToBrowse]);

  const handleCollectionSelect = useCallback((id: string) => {
    setCollectionId(id);
    setCategoryFilter('all');
    setTimeout(scrollToBrowse, 100);
  }, [scrollToBrowse]);

  const handleQuizComplete = useCallback(
    (result: PackageQuizResult) => {
      if (result.category) setCategoryFilter(result.category);
      setCollectionId(null);
      setMaxPriceFilter(result.maxPrice);
      setSort(result.sort);
      toast.success('Here are bundles picked for you');
      setTimeout(scrollToBrowse, 200);
    },
    [scrollToBrowse]
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setCategoryFilter('all');
    setCollectionId(null);
    setMaxPriceFilter(undefined);
    setSort('savings');
  }, []);

  const fomoRows = [
    {
      title: 'Trending right now',
      subtitle: 'What queens are discovering this week',
      urgency: 'Popular picks',
      packages: trending,
      trending: true,
    },
    {
      title: "Today's best deals",
      subtitle: 'Maximum savings on complete bundles',
      urgency: 'Best value',
      packages: bestDeals,
    },
    {
      title: 'Most loved packages',
      subtitle: 'Customer favorites worth every shilling',
      packages: mostLoved,
    },
    {
      title: 'SheQueen exclusives',
      subtitle: 'Our signature curated collections',
      packages: signatures,
    },
    {
      title: 'New arrivals',
      subtitle: 'Fresh bundles just added',
      urgency: 'Just in',
      packages: newArrivals,
    },
  ];

  return (
    <>
      <Header />
      <main className="overflow-x-clip mobile-scroll-optimize bg-background pb-20 sm:pb-0">
        <PackageHeroCarousel
          packages={heroPackages}
          products={products}
          retailPrices={retailPrices}
          onShopPackages={scrollToBrowse}
          onFindPerfect={() => setQuizOpen(true)}
        />

        <PackageSearchBar
          ref={searchInputRef}
          search={search}
          totalPackages={activePackages.length}
          resultCount={filteredPackages.length}
          onSearchChange={setSearch}
          onClear={() => setSearch('')}
          onSubmit={handlePackageSearchSubmit}
        />

        <PackageDiscoveryCategories
          packages={activePackages}
          products={products}
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

        <PackageBrowseSection
          loading={loading}
          packages={filteredPackages}
          products={products}
          retailPrices={retailPrices}
          search={search}
          sort={sort}
          categoryFilter={categoryFilter}
          collectionTitle={collectionTitle}
          filtersExpanded={filtersExpanded}
          onSearchChange={setSearch}
          onSortChange={setSort}
          onCategoryChange={(v) => {
            setCategoryFilter(v);
            setCollectionId(null);
          }}
          onFiltersExpandedChange={setFiltersExpanded}
          onClearFilters={clearFilters}
          onQuickView={handleQuickView}
          onAddToCart={handleAddToCart}
        />

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
        onDeals={scrollToDeals}
        onBrowse={scrollToBrowse}
      />
    </>
  );
}
