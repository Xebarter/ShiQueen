'use client';

import Link from 'next/link';
import { shopCategoryPath } from '@/lib/seo/shop-categories';
import { cn } from '@/lib/utils';

export const SHOP_CATEGORY_TABS = [
  { id: 'all', label: 'All Products', shortLabel: 'All' },
  { id: 'clothing', label: 'Clothing', shortLabel: 'Clothes' },
  { id: 'beauty', label: 'Beauty', shortLabel: 'Beauty' },
  { id: 'wellness', label: 'Wellness', shortLabel: 'Wellness' },
  { id: 'accessories', label: 'Accessories', shortLabel: 'Access.' },
  { id: 'home', label: 'Home', shortLabel: 'Home' },
] as const;

type ShopCategoryStripProps = {
  category: string;
  onSelect?: (id: string) => void;
  /** When true, tabs navigate to shop routes instead of calling onSelect. */
  asLinks?: boolean;
  /** Include the larger desktop category chips. */
  showDesktop?: boolean;
  className?: string;
};

export function ShopCategoryStrip({
  category,
  onSelect,
  asLinks = false,
  showDesktop = true,
  className,
}: ShopCategoryStripProps) {
  return (
    <div
      className={cn(
        'sticky top-[var(--mobile-header-offset,4rem)] z-40 border-b border-border/60 bg-background/90 backdrop-blur-md lg:top-16',
        !showDesktop && 'md:hidden',
        className
      )}
    >
      <div className="mx-auto max-w-[90rem] px-3 py-2 sm:px-4 sm:py-3 lg:px-5">
        <div className="grid grid-cols-6 gap-0.5 md:hidden">
          {SHOP_CATEGORY_TABS.map((cat) => {
            const active = category === cat.id;
            const itemClass = cn(
              'min-w-0 rounded-full px-0.5 py-2 text-center text-[10px] font-medium leading-tight transition',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            );
            if (asLinks) {
              return (
                <Link
                  key={cat.id}
                  href={shopCategoryPath(cat.id)}
                  className={itemClass}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="block truncate">{cat.shortLabel}</span>
                </Link>
              );
            }
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect?.(cat.id)}
                className={itemClass}
              >
                <span className="block truncate">{cat.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {showDesktop ? (
          <div className="hidden gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 md:flex">
            {SHOP_CATEGORY_TABS.map((cat) => {
              const active = category === cat.id;
              const itemClass = cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
                active
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              );
              if (asLinks) {
                return (
                  <Link
                    key={cat.id}
                    href={shopCategoryPath(cat.id)}
                    className={itemClass}
                    aria-current={active ? 'page' : undefined}
                  >
                    {cat.label}
                  </Link>
                );
              }
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelect?.(cat.id)}
                  className={itemClass}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
