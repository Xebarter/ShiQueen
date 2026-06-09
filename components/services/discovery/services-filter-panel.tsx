'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SERVICE_PRICE_PRESETS } from '@/lib/services-utils';
import type { ServiceCategory, ServicePricePreset, ServiceSortMode } from '@/lib/types/services';
import { cn } from '@/lib/utils';

export interface ServicesFilterState {
  categoryId: string;
  sort: ServiceSortMode;
  pricePreset: ServicePricePreset;
  minRating: number;
  mobileOnly: boolean;
  inStudioOnly: boolean;
}

interface ServicesFilterPanelProps {
  categories: ServiceCategory[];
  filters: ServicesFilterState;
  onChange: (patch: Partial<ServicesFilterState>) => void;
  onClearAll: () => void;
  activeFilterCount: number;
  className?: string;
  showHeader?: boolean;
}

const SORT_OPTIONS: { value: ServiceSortMode; label: string }[] = [
  { value: 'popular', label: 'Most popular' },
  { value: 'trending', label: 'Trending' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
];

const RATING_OPTIONS = [
  { value: 0, label: 'Any rating' },
  { value: 4, label: '4+ stars' },
  { value: 4.5, label: '4.5+ stars' },
];

export function ServicesFilterPanel({
  categories,
  filters,
  onChange,
  onClearAll,
  activeFilterCount,
  className,
  showHeader = true,
}: ServicesFilterPanelProps) {
  const activeChips: { label: string; onRemove: () => void }[] = [];

  if (filters.categoryId) {
    const cat = categories.find((c) => c.id === filters.categoryId);
    activeChips.push({
      label: cat?.name ?? filters.categoryId,
      onRemove: () => onChange({ categoryId: '' }),
    });
  }
  if (filters.pricePreset !== 'all') {
    const preset = SERVICE_PRICE_PRESETS.find((p) => p.id === filters.pricePreset);
    activeChips.push({
      label: preset?.label ?? filters.pricePreset,
      onRemove: () => onChange({ pricePreset: 'all' }),
    });
  }
  if (filters.minRating > 0) {
    activeChips.push({
      label: `${filters.minRating}+ stars`,
      onRemove: () => onChange({ minRating: 0 }),
    });
  }
  if (filters.mobileOnly) {
    activeChips.push({
      label: 'Home / mobile',
      onRemove: () => onChange({ mobileOnly: false }),
    });
  }
  if (filters.inStudioOnly) {
    activeChips.push({
      label: 'In-studio',
      onRemove: () => onChange({ inStudioOnly: false }),
    });
  }

  return (
    <div className={cn('space-y-6', className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Filters</h2>
          {activeFilterCount > 0 && (
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onClearAll}>
              Clear all
            </Button>
          )}
        </div>
      )}

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium">Category</Label>
        <select
          value={filters.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          className="flex h-11 w-full rounded-xl border border-border/70 bg-muted/30 px-3 text-sm transition focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/10"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Sort by</Label>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as ServiceSortMode })}
          className="flex h-11 w-full rounded-xl border border-border/70 bg-muted/30 px-3 text-sm transition focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/10"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Price range</Label>
        <div className="flex flex-wrap gap-2">
          {SERVICE_PRICE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange({ pricePreset: preset.id })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                filters.pricePreset === preset.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/30'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Minimum rating</Label>
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ minRating: opt.value })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                filters.minRating === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/30'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Service type</Label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.mobileOnly}
            onChange={(e) => onChange({ mobileOnly: e.target.checked, inStudioOnly: e.target.checked ? false : filters.inStudioOnly })}
            className="rounded border-input"
          />
          Home / mobile service
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.inStudioOnly}
            onChange={(e) => onChange({ inStudioOnly: e.target.checked, mobileOnly: e.target.checked ? false : filters.mobileOnly })}
            className="rounded border-input"
          />
          In-studio only
        </label>
      </div>
    </div>
  );
}
