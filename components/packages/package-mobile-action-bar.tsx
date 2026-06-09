'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles, ShoppingBag, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackageMobileActionBarProps {
  cartCount?: number;
  onSearch: () => void;
  onDeals: () => void;
  onBrowse: () => void;
}

export function PackageMobileActionBar({
  cartCount = 0,
  onSearch,
  onDeals,
  onBrowse,
}: PackageMobileActionBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 px-4 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md transition-transform duration-300 sm:hidden',
        visible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around gap-1">
        <button
          type="button"
          onClick={onSearch}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
        >
          <Search className="h-5 w-5" />
          Search
        </button>
        <button
          type="button"
          onClick={onDeals}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
        >
          <Sparkles className="h-5 w-5" />
          Deals
        </button>
        <button
          type="button"
          onClick={onBrowse}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-primary"
        >
          <Package className="h-5 w-5" />
          Browse
        </button>
        <Link
          href="/cart"
          className="relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
        >
          <ShoppingBag className="h-5 w-5" />
          Cart
          {cartCount > 0 && (
            <span className="absolute right-2 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
