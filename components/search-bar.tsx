'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Loader2, Clock, ArrowRight, Gift, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCatalogSearch } from '@/lib/hooks/use-catalog-search';
import type { CatalogSearchHit } from '@/lib/catalog-search';
import { ProductImage, isRemoteProductImage } from '@/components/product-image';
import { PackageCoverDisplay } from '@/components/packages/package-cover-display';
import { usePublicProducts, usePublicPackages } from '@/lib/hooks/use-public-catalog';
import { useServices } from '@/lib/services-context';
import { useFeatureFlags } from '@/lib/feature-flags-context';
import {
  buildPackageCatalogMaps,
  getPackageCoverImages,
  resolvePackageSavings,
} from '@/lib/package-utils';
import { getPackageCategoryLabel } from '@/lib/package-catalog';
import { getProviderById, resolveListingImage } from '@/lib/services-utils';
import { formatUGX } from '@/lib/wholesale-data';
import type { ServiceListing, ServiceProvider } from '@/lib/types/services';
import Image from 'next/image';
import {
  SEARCH_HISTORY_UPDATED_EVENT,
  readRecentSearchQueries,
  recordSearchHistory,
} from '@/lib/search-history';

const RESULT_LIMIT = 8;
const RECENT_PREVIEW = 5;

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-accent/25 px-0.5 text-foreground">{text.slice(index, index + trimmed.length)}</mark>
      {text.slice(index + trimmed.length)}
    </>
  );
}

function getHitHref(hit: CatalogSearchHit): string {
  if (hit.type === 'product') return `/products/${hit.product.id}`;
  if (hit.type === 'package') return `/packages/${hit.pkg.id}`;
  return `/services/${hit.listing.slug}`;
}

function getHitLabel(hit: CatalogSearchHit): string {
  if (hit.type === 'product') return hit.product.name;
  if (hit.type === 'package') return hit.pkg.name;
  return hit.listing.name;
}

function SearchResultRow({
  hit,
  query,
  active,
  onSelect,
  products,
  services,
  providers,
  retailPrices,
}: {
  hit: CatalogSearchHit;
  query: string;
  active: boolean;
  onSelect: (hit: CatalogSearchHit) => void;
  products: ReturnType<typeof usePublicProducts>['products'];
  services: ServiceListing[];
  providers: ServiceProvider[];
  retailPrices: Record<string, number>;
}) {
  const handleSelect = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(hit);
  };

  if (hit.type === 'product') {
    const { product } = hit;

    return (
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={handleSelect}
        className={cn(
          'flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors',
          active ? 'bg-secondary' : 'hover:bg-secondary/70'
        )}
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-border/60">
          <ProductImage
            product={product}
            className="h-full w-full"
            imageClassName="object-cover"
            fallbackClassName="text-2xl"
            sizes="56px"
            variant="thumb"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium leading-snug text-foreground">
            <HighlightMatch text={product.name} query={query} />
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {product.category}
            {product.sku ? ` · ${product.sku}` : ''}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[15px] font-semibold tabular-nums text-foreground">
            {formatUGX(product.price)}
          </p>
          {product.originalPrice && product.originalPrice > product.price && (
            <p className="text-xs text-muted-foreground line-through">
              {formatUGX(product.originalPrice)}
            </p>
          )}
        </div>
      </button>
    );
  }

  if (hit.type === 'service') {
    const { listing } = hit;
    const image = resolveListingImage(listing, getProviderById(providers, listing.providerId));

    return (
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={handleSelect}
        className={cn(
          'flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors',
          active ? 'bg-secondary' : 'hover:bg-secondary/70'
        )}
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-border/60 bg-muted">
          {image && isRemoteProductImage(image) ? (
            <Image src={image} alt={listing.name} fill sizes="56px" quality={75} className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium leading-snug text-foreground">
            <HighlightMatch text={listing.name} query={query} />
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-primary">
              <Sparkles className="h-3 w-3" />
              Service
            </span>
            {listing.serviceType ? ` · ${listing.serviceType}` : ''}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[15px] font-semibold tabular-nums text-foreground">
            {formatUGX(listing.basePrice)}
          </p>
        </div>
      </button>
    );
  }

  const { pkg } = hit;
  const coverImages = getPackageCoverImages(pkg, products, services, providers);
  const { packagePrice } = resolvePackageSavings(pkg, retailPrices);

  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={handleSelect}
      className={cn(
        'flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors',
        active ? 'bg-secondary' : 'hover:bg-secondary/70'
      )}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-border/60">
        <PackageCoverDisplay
          images={coverImages}
          alt={pkg.name}
          className="h-full w-full"
          imageClassName="object-cover"
          sizes="56px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium leading-snug text-foreground">
          <HighlightMatch text={pkg.name} query={query} />
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-primary">
            <Gift className="h-3 w-3" />
            Bundle
          </span>
          {pkg.category ? ` · ${getPackageCategoryLabel(pkg.category)}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[15px] font-semibold tabular-nums text-foreground">
          {formatUGX(packagePrice)}
        </p>
        <p className="text-xs text-accent">Save {pkg.savingsPercentage.toFixed(0)}%</p>
      </div>
    </button>
  );
}

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const { products } = usePublicProducts();
  const { packages } = usePublicPackages();
  const { activeListings, activeProviders } = useServices();
  const { flags } = useFeatureFlags();
  const { search, loading, catalogCount } = useCatalogSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const queryRef = useRef(query);
  queryRef.current = query;

  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();
  const isSearching = query !== deferredQuery;

  const activePackages = useMemo(() => packages.filter((pkg) => pkg.isActive), [packages]);
  const retailPrices = useMemo(
    () => buildPackageCatalogMaps(products, activeListings, activePackages).retailPrices,
    [activePackages, products, activeListings]
  );

  const results = useMemo(() => {
    if (!trimmedQuery) return [];
    return search(trimmedQuery, RESULT_LIMIT);
  }, [search, trimmedQuery]);

  const showDropdown = isOpen && (trimmedQuery.length > 0 || recentSearches.length > 0);
  const navigableCount = results.length + (trimmedQuery ? 1 : 0);

  const updateDropdownPosition = useCallback(() => {
    const anchor = inputRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const viewportPadding = 12;
    const viewportWidth = window.innerWidth;
    const maxWidth = viewportWidth - viewportPadding * 2;
    const isCompactViewport = viewportWidth < 640;

    // On phones, span nearly the full screen; on larger screens keep a wide plate
    const preferredWidth = isCompactViewport
      ? maxWidth
      : Math.min(maxWidth, Math.max(rect.width, 480));

    let left = isCompactViewport ? viewportPadding : rect.left;
    if (left + preferredWidth > viewportWidth - viewportPadding) {
      left = viewportWidth - viewportPadding - preferredWidth;
    }
    left = Math.max(viewportPadding, left);

    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left,
      width: preferredWidth,
      zIndex: 200,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    const syncRecent = () => setRecentSearches(readRecentSearchQueries(RECENT_PREVIEW));
    syncRecent();
    window.addEventListener(SEARCH_HISTORY_UPDATED_EVENT, syncRecent);
    window.addEventListener('storage', syncRecent);
    return () => {
      window.removeEventListener(SEARCH_HISTORY_UPDATED_EVENT, syncRecent);
      window.removeEventListener('storage', syncRecent);
    };
  }, []);

  useLayoutEffect(() => {
    if (!showDropdown) return;
    updateDropdownPosition();

    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [showDropdown, updateDropdownPosition, query, results.length]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [trimmedQuery]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const rememberSearch = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    recordSearchHistory(trimmed, 'catalog');
  }, []);

  const commitSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      rememberSearch(trimmed);
      setQuery('');
      setIsOpen(false);
      router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
    },
    [rememberSearch, router]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  const handleRecentSelect = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      rememberSearch(trimmed);
      setQuery(trimmed);
      setActiveIndex(-1);
      setIsOpen(true);
      inputRef.current?.focus();
    },
    [rememberSearch]
  );

  const handleResultSelect = useCallback(
    (hit: CatalogSearchHit) => {
      const href = getHitHref(hit);
      const typed = queryRef.current.trim();
      // Prefer the typed query; fall back to the clicked item name.
      rememberSearch(typed || getHitLabel(hit));
      setQuery('');
      setIsOpen(false);
      setActiveIndex(-1);
      router.push(href);
    },
    [rememberSearch, router]
  );

  const handleViewAllSelect = useCallback(() => {
    const typed = queryRef.current.trim() || trimmedQuery;
    if (!typed) return;
    rememberSearch(typed);
    setQuery('');
    setIsOpen(false);
    router.push(`/shop?q=${encodeURIComponent(typed)}`);
  }, [rememberSearch, router, trimmedQuery]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown && event.key === 'ArrowDown' && trimmedQuery) {
      setIsOpen(true);
      setActiveIndex(0);
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, navigableCount - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleResultSelect(results[activeIndex]);
        return;
      }
      if (trimmedQuery) {
        commitSearch(trimmedQuery);
      }
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const dropdown = showDropdown ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl shadow-black/10 ring-1 ring-black/5"
    >
      {!trimmedQuery && recentSearches.length > 0 && (
        <div className="border-b border-border/60 p-3">
          <div className="mb-1 flex items-center justify-between gap-2 px-2">
            <p className="py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Recent
            </p>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setIsOpen(false);
                router.push('/account#search');
              }}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              View all
            </button>
          </div>
          {recentSearches.map((item) => (
            <button
              key={item}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleRecentSelect(item)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition hover:bg-secondary"
            >
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{item}</span>
            </button>
          ))}
        </div>
      )}

      {trimmedQuery && results.length > 0 && (
        <>
          <div className="max-h-[min(70dvh,28rem)] overflow-y-auto overscroll-contain py-1">
            {results.map((hit, index) => (
              <SearchResultRow
                key={
                  hit.type === 'product'
                    ? hit.product.id
                    : hit.type === 'package'
                      ? hit.pkg.id
                      : hit.listing.id
                }
                hit={hit}
                query={trimmedQuery}
                active={activeIndex === index}
                onSelect={handleResultSelect}
                products={products}
                services={activeListings}
                providers={activeProviders}
                retailPrices={retailPrices}
              />
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleViewAllSelect}
            className={cn(
              'flex w-full items-center justify-center gap-2 border-t border-border px-4 py-3.5 text-sm font-medium text-primary transition hover:bg-secondary',
              activeIndex === results.length && 'bg-secondary'
            )}
          >
            View all results for &ldquo;{trimmedQuery}&rdquo;
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      )}

      {trimmedQuery && !loading && results.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No {flags.packages || flags.services ? 'products, bundles, or services' : 'products'} found
            for &ldquo;{trimmedQuery}&rdquo;
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Try a different name or category
          </p>
        </div>
      )}

      {trimmedQuery && catalogCount === 0 && !loading && (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          Nothing available to search yet.
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-md', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={
            loading
              ? 'Loading catalog…'
              : flags.packages && flags.services
                ? 'Search products, bundles & services…'
                : flags.packages
                  ? 'Search products & bundles…'
                  : flags.services
                    ? 'Search products & services…'
                    : 'Search products…'
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {(isSearching || loading) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
          )}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {mounted && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
