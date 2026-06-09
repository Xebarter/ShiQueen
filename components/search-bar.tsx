'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Search, X, Loader2, Clock, ArrowRight, Gift } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCatalogSearch } from '@/lib/hooks/use-catalog-search';
import type { CatalogSearchHit } from '@/lib/catalog-search';
import { formatUGX } from '@/lib/wholesale-data';
import { ProductImage } from '@/components/product-image';
import { PackageCoverDisplay } from '@/components/packages/package-cover-display';
import { useProducts } from '@/lib/products-context';
import { getPackageCoverImages, resolvePackageSavings } from '@/lib/package-utils';
import { getPackageCategoryLabel } from '@/lib/package-catalog';
import {
  getProductNameMap,
  getRetailPricesMap,
  productsToCatalog,
} from '@/lib/wholesale-data';
import { useWholesale } from '@/lib/wholesale-context';
import { mergePackageItemMaps } from '@/lib/package-utils';

const RECENT_SEARCHES_KEY = 'shequeen-recent-searches';
const MAX_RECENT = 5;
const RESULT_LIMIT = 8;

function readRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((item) => typeof item === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function storeRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed || typeof window === 'undefined') return;
  const next = [trimmed, ...readRecentSearches().filter((item) => item !== trimmed)].slice(
    0,
    MAX_RECENT
  );
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

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
  return hit.type === 'product' ? `/products/${hit.product.id}` : `/packages/${hit.pkg.id}`;
}

function SearchResultRow({
  hit,
  query,
  active,
  onSelect,
  products,
  retailPrices,
}: {
  hit: CatalogSearchHit;
  query: string;
  active: boolean;
  onSelect: () => void;
  products: ReturnType<typeof useProducts>['products'];
  retailPrices: Record<string, number>;
}) {
  if (hit.type === 'product') {
    const { product } = hit;

    return (
      <Link
        href={getHitHref(hit)}
        onClick={onSelect}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 transition-colors',
          active ? 'bg-secondary' : 'hover:bg-secondary/70'
        )}
      >
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/60">
          <ProductImage
            product={product}
            className="h-full w-full"
            imageClassName="object-cover"
            fallbackClassName="text-2xl"
            sizes="44px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            <HighlightMatch text={product.name} query={query} />
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {product.category}
            {product.sku ? ` · ${product.sku}` : ''}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-foreground">{formatUGX(product.price)}</p>
          {product.originalPrice && product.originalPrice > product.price && (
            <p className="text-[11px] text-muted-foreground line-through">
              {formatUGX(product.originalPrice)}
            </p>
          )}
        </div>
      </Link>
    );
  }

  const { pkg } = hit;
  const coverImages = getPackageCoverImages(pkg, products);
  const { packagePrice } = resolvePackageSavings(pkg, retailPrices);

  return (
    <Link
      href={getHitHref(hit)}
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 transition-colors',
        active ? 'bg-secondary' : 'hover:bg-secondary/70'
      )}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/60">
        <PackageCoverDisplay
          images={coverImages}
          alt={pkg.name}
          className="h-full w-full"
          imageClassName="object-cover"
          sizes="44px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          <HighlightMatch text={pkg.name} query={query} />
        </p>
        <p className="truncate text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-primary">
            <Gift className="h-3 w-3" />
            Bundle
          </span>
          {pkg.category ? ` · ${getPackageCategoryLabel(pkg.category)}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-foreground">{formatUGX(packagePrice)}</p>
        <p className="text-[11px] text-accent">Save {pkg.savingsPercentage.toFixed(0)}%</p>
      </div>
    </Link>
  );
}

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const { products } = useProducts();
  const { packages } = useWholesale();
  const { search, loading, catalogCount } = useCatalogSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();
  const isSearching = query !== deferredQuery;

  const activePackages = useMemo(() => packages.filter((pkg) => pkg.isActive), [packages]);
  const catalog = useMemo(() => productsToCatalog(products), [products]);
  const retailPrices = useMemo(
    () =>
      mergePackageItemMaps(
        activePackages,
        getProductNameMap(catalog),
        getRetailPricesMap(catalog)
      ).retailPrices,
    [activePackages, catalog]
  );

  const results = useMemo(() => {
    if (!trimmedQuery) return [];
    return search(trimmedQuery, RESULT_LIMIT);
  }, [search, trimmedQuery]);

  const showDropdown = isOpen && (trimmedQuery.length > 0 || recentSearches.length > 0);
  const navigableCount = results.length + (trimmedQuery ? 1 : 0);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [trimmedQuery]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const commitSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      storeRecentSearch(trimmed);
      setRecentSearches(readRecentSearches());
      setQuery('');
      setIsOpen(false);
      router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
    },
    [router]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  const handleSelect = useCallback(() => {
    if (trimmedQuery) storeRecentSearch(trimmedQuery);
    setRecentSearches(readRecentSearches());
    setQuery('');
    setIsOpen(false);
  }, [trimmedQuery]);

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
        const hit = results[activeIndex];
        handleSelect();
        router.push(getHitHref(hit));
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
          placeholder={loading ? 'Loading catalog…' : 'Search products & bundles…'}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[100] overflow-hidden rounded-xl border border-border bg-background shadow-xl">
          {!trimmedQuery && recentSearches.length > 0 && (
            <div className="border-b border-border/60 p-2">
              <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Recent
              </p>
              {recentSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => commitSearch(item)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-secondary"
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}

          {trimmedQuery && results.length > 0 && (
            <>
              <div className="max-h-80 overflow-y-auto overscroll-contain">
                {results.map((hit, index) => (
                  <SearchResultRow
                    key={hit.type === 'product' ? hit.product.id : hit.pkg.id}
                    hit={hit}
                    query={trimmedQuery}
                    active={activeIndex === index}
                    onSelect={handleSelect}
                    products={products}
                    retailPrices={retailPrices}
                  />
                ))}
              </div>
              <Link
                href={`/shop?q=${encodeURIComponent(trimmedQuery)}`}
                onClick={handleSelect}
                className={cn(
                  'flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-medium text-primary transition hover:bg-secondary',
                  activeIndex === results.length && 'bg-secondary'
                )}
              >
                View all results for &ldquo;{trimmedQuery}&rdquo;
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}

          {trimmedQuery && !loading && results.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No products or bundles found for &ldquo;{trimmedQuery}&rdquo;
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different name, category, or bundle occasion
              </p>
            </div>
          )}

          {trimmedQuery && catalogCount === 0 && !loading && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nothing available to search yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
