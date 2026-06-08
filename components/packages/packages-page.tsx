'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { PackageCard, PackageCardSkeleton } from '@/components/packages/package-card';
import { useWholesale } from '@/lib/wholesale-context';
import { useCart } from '@/lib/cart-context';
import { useProducts } from '@/lib/products-context';
import {
  getProductNameMap,
  getRetailPricesMap,
  productsToCatalog,
  formatUGX,
} from '@/lib/wholesale-data';
import { getPackageImage, resolvePackageSavings } from '@/lib/package-utils';
import { PackageRule } from '@/lib/types/wholesale';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Boxes,
  Gift,
  Layers,
  Package,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
} from 'lucide-react';

type SortOption = 'name' | 'price-low' | 'price-high' | 'savings';
type FilterType = 'all' | PackageRule['type'];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'savings', label: 'Best savings' },
  { value: 'price-low', label: 'Price: Low to high' },
  { value: 'price-high', label: 'Price: High to low' },
  { value: 'name', label: 'Name A–Z' },
];

const TYPE_FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'customizable', label: 'Customizable' },
  { value: 'mix-and-match', label: 'Mix & match' },
];

const PACKAGE_TYPES_INFO = [
  {
    icon: Gift,
    title: 'Fixed packages',
    description: 'Pre-selected combinations with guaranteed pricing — ideal for gift sets.',
  },
  {
    icon: Layers,
    title: 'Customizable',
    description: 'Curated bases you can tailor while keeping the package price.',
  },
  {
    icon: Tag,
    title: 'Mix & match',
    description: 'Flexible picks from included products up to the package limit.',
  },
] as const;

export function PackagesPage() {
  const { packages, setSelectedPackage, loading } = useWholesale();
  const { addItem } = useCart();
  const { products } = useProducts();
  const catalog = productsToCatalog(products);
  const productNames = getProductNameMap(catalog);
  const retailPrices = getRetailPricesMap(catalog);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('savings');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const activePackages = useMemo(() => packages.filter((p) => p.isActive), [packages]);

  const filteredPackages = useMemo(() => {
    const term = search.toLowerCase().trim();
    let result = activePackages;

    if (term) {
      result = result.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(term) ||
          pkg.description.toLowerCase().includes(term) ||
          pkg.items.some((item) =>
            (productNames[item.productId] ?? '').toLowerCase().includes(term)
          )
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter((pkg) => pkg.rule.type === typeFilter);
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
  }, [activePackages, search, sort, typeFilter, productNames, retailPrices]);

  const bestDeal = useMemo(() => {
    if (activePackages.length === 0) return null;
    return activePackages.reduce((best, pkg) => {
      const bestSavings = resolvePackageSavings(best, retailPrices).savingsPercentage;
      const pkgSavings = resolvePackageSavings(pkg, retailPrices).savingsPercentage;
      return pkgSavings > bestSavings ? pkg : best;
    });
  }, [activePackages, retailPrices]);

  const hasActiveFilters = search.trim().length > 0 || typeFilter !== 'all';

  const handleAddToCart = (pkg: (typeof packages)[0], e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { packagePrice } = resolvePackageSavings(pkg, retailPrices);
    setSelectedPackage(pkg);
    addItem({
      id: pkg.id,
      name: pkg.name,
      price: packagePrice,
      image: getPackageImage(pkg, products),
      quantity: 1,
    });
    toast.success('Package added to cart!');
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setSort('savings');
  };

  return (
    <>
      <Header />
      <main className="overflow-x-hidden bg-background">
        {/* Hero */}
        <section className="relative border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-background to-background" />
          <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-10 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-2xl"
            >
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary sm:text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                Bundle & save
              </span>
              <h1 className="text-3xl font-light tracking-tight sm:text-4xl md:text-5xl">
                Curated <span className="font-semibold text-primary">packages</span>
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                Ready-made collections at special prices. Less browsing, more value — perfect on
                mobile or desktop.
              </p>
            </motion.div>

            {!loading && activePackages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-stretch"
              >
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3.5 shadow-sm backdrop-blur-sm sm:min-w-[10rem]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Boxes className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Available</p>
                    <p className="text-xl font-bold tabular-nums">{activePackages.length}</p>
                  </div>
                </div>

                {bestDeal && (
                  <Link
                    href={`/packages/${bestDeal.id}`}
                    className="group flex flex-1 items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3.5 transition-colors hover:bg-accent/15 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                        Top deal
                      </p>
                      <p className="truncate font-semibold">{bestDeal.name}</p>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        Save{' '}
                        {resolvePackageSavings(bestDeal, retailPrices).savingsPercentage.toFixed(0)}
                        % ·{' '}
                        {formatUGX(
                          resolvePackageSavings(bestDeal, retailPrices).savingsAmount
                        )}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </motion.div>
            )}
          </div>
        </section>

        {/* Sticky filters */}
        {activePackages.length > 0 && (
          <div className="sticky top-[var(--mobile-header-offset,4rem)] z-40 border-b border-border/60 bg-background/92 backdrop-blur-md lg:top-16">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search packages or products…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:h-10 sm:text-sm"
                />
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-1 px-1">
                {TYPE_FILTERS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTypeFilter(opt.value)}
                    className={cn(
                      'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
                      typeFilter === opt.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {loading ? 'Loading…' : (
                    <>
                      <span className="font-medium text-foreground">{filteredPackages.length}</span>
                      {' '}package{filteredPackages.length === 1 ? '' : 's'}
                      {hasActiveFilters ? ' matched' : ''}
                    </>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltersExpanded((v) => !v)}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium sm:hidden"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Sort
                  </button>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className={cn(
                      'h-9 rounded-lg border border-border bg-background px-3 text-xs sm:text-sm',
                      filtersExpanded ? 'block w-full sm:w-auto' : 'hidden sm:block'
                    )}
                    aria-label="Sort packages"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="hidden h-9 text-xs sm:inline-flex"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {filtersExpanded && (
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm sm:hidden"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Package grid */}
        <section className="py-6 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <PackageCardSkeleton key={i} />
                ))}
              </div>
            ) : activePackages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-14 text-center sm:py-16">
                <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                <h2 className="text-lg font-semibold">No packages yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Check back soon for curated bundles, or shop individual products today.
                </p>
                <Link href="/shop" className="mt-6 inline-block">
                  <Button className="h-11 rounded-xl px-6">Browse shop</Button>
                </Link>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
                <p className="text-muted-foreground">No packages match your filters.</p>
                <Button variant="outline" className="mt-4 rounded-xl" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {filteredPackages.map((pkg, index) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    productNames={productNames}
                    retailPrices={retailPrices}
                    products={products}
                    index={index}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* How it works — horizontal scroll on mobile */}
        <section className="border-t border-border/60 bg-muted/20 py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
                  How packages work
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Three ways we bundle value for you
                </p>
              </div>
              <Link href="/shop" className="hidden sm:block">
                <Button variant="outline" className="gap-2 rounded-xl">
                  Shop individual items
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0">
              {PACKAGE_TYPES_INFO.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="w-[min(85vw,18rem)] shrink-0 snap-start rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:w-auto"
                >
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <Link href="/shop" className="mt-6 block sm:hidden">
              <Button variant="outline" className="h-11 w-full gap-2 rounded-xl">
                Shop individual items
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
