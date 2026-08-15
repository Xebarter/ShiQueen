'use client';

import type { ServiceCategory } from '@/lib/types/services';
import { cn } from '@/lib/utils';

const CATEGORY_SHORT: Record<string, string> = {
  'hair-services': 'Hair',
  'nail-services': 'Nails',
  'makeup-services': 'Makeup',
  'eyelash-eyebrow-services': 'Lashes',
  'spa-wellness': 'Spa',
  'skincare-services': 'Skincare',
  'waxing-hair-removal': 'Waxing',
  'bridal-services': 'Bridal',
  'home-beauty-services': 'Home',
  'fashion-styling': 'Fashion',
  'photography-services': 'Photo',
  'fitness-wellness': 'Fitness',
  'motherhood-services': 'Motherhood',
  'event-services': 'Events',
  'professional-lifestyle': 'Pro',
  'luxury-services': 'Luxury',
};

interface ServicesCategoryNavProps {
  categories: ServiceCategory[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

export function ServicesCategoryNav({
  categories,
  selectedCategoryId,
  onSelectCategory,
  className,
}: ServicesCategoryNavProps) {
  const tabs = [
    { id: '', label: 'All', shortLabel: 'All' },
    ...categories.map((cat) => ({
      id: cat.id,
      label: cat.name,
      shortLabel: CATEGORY_SHORT[cat.id] ?? cat.name.split(' ')[0] ?? cat.name,
    })),
  ];

  const handleSelect = (id: string) => {
    onSelectCategory(id);
    document.getElementById('services-browse')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className={cn(
        'sticky top-[var(--mobile-header-offset,4rem)] z-40 border-b border-border/60 bg-background/90 backdrop-blur-md lg:top-16',
        className
      )}
    >
      <div className="mx-auto max-w-[90rem] px-3 py-2 sm:px-4 sm:py-3 lg:px-5">
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide -mx-1 px-1 md:hidden">
          {tabs.map((tab) => {
            const active = selectedCategoryId === tab.id;
            return (
              <button
                key={tab.id || 'all'}
                type="button"
                onClick={() => handleSelect(tab.id)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-2 text-center text-[11px] font-medium leading-tight transition',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                )}
              >
                {tab.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="hidden gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 md:flex">
          {tabs.map((tab) => {
            const active = selectedCategoryId === tab.id;
            return (
              <button
                key={tab.id || 'all'}
                type="button"
                onClick={() => handleSelect(tab.id)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
