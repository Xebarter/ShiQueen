'use client';

import { cn } from '@/lib/utils';
import type { ServiceCategory } from '@/lib/types/services';

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

const CATEGORY_EMOJI: Record<string, string> = {
  'hair-services': '💇‍♀️',
  'nail-services': '💅',
  'makeup-services': '💄',
  'eyelash-eyebrow-services': '👁️',
  'spa-wellness': '🧘',
  'skincare-services': '✨',
  'waxing-hair-removal': '🌸',
  'bridal-services': '👰',
  'home-beauty-services': '🏠',
  'fashion-styling': '👗',
  'photography-services': '📸',
  'fitness-wellness': '💪',
  'motherhood-services': '🤱',
  'event-services': '🎉',
  'professional-lifestyle': '💼',
  'luxury-services': '👑',
};

interface ServicesCategoryNavProps {
  categories: ServiceCategory[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onBrowseClick?: () => void;
}

export function ServicesCategoryNav({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onBrowseClick,
}: ServicesCategoryNavProps) {
  const handleSelect = (id: string) => {
    onSelectCategory(id);
    onBrowseClick?.();
    document.getElementById('services-browse')?.scrollIntoView({ behavior: 'smooth' });
  };

  const pillClass = (active: boolean) =>
    cn(
      'shrink-0 snap-start inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all',
      active
        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/20'
        : 'border border-border/70 bg-card text-foreground shadow-sm hover:border-primary/40 hover:shadow-md'
    );

  return (
    <section className="border-b border-border/50 bg-gradient-to-b from-muted/40 to-muted/20 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl border border-border/50 bg-card/80 p-2 shadow-sm backdrop-blur-sm">
          <div
            className="pointer-events-none absolute inset-y-2 left-2 z-10 w-10 rounded-l-xl bg-gradient-to-r from-card to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-2 right-2 z-10 w-10 rounded-r-xl bg-gradient-to-l from-card to-transparent"
            aria-hidden
          />
          <div className="flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-hide snap-x snap-mandatory touch-pan-x">
            <button type="button" onClick={() => handleSelect('')} className={pillClass(!selectedCategoryId)}>
              <span aria-hidden>✨</span>
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelect(cat.id)}
                className={pillClass(selectedCategoryId === cat.id)}
              >
                <span aria-hidden className="text-base leading-none">
                  {CATEGORY_EMOJI[cat.id] ?? '✨'}
                </span>
                {CATEGORY_SHORT[cat.id] ?? cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
