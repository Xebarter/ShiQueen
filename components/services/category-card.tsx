'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { isRemoteProductImage } from '@/components/product-image';
import type { ServiceCategory } from '@/lib/types/services';
import { countCategoryServices } from '@/lib/services-utils';
import type { ServiceListing } from '@/lib/types/services';
import { resolveCategoryCoverImage } from '@/lib/services-utils';
import { cn } from '@/lib/utils';

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

interface CategoryCardProps {
  category: ServiceCategory;
  listings: ServiceListing[];
  compact?: boolean;
  className?: string;
}

export function CategoryCard({ category, listings, compact, className }: CategoryCardProps) {
  const cover = resolveCategoryCoverImage(category.id, listings);
  const count = countCategoryServices(category.id, listings);
  const emoji = CATEGORY_EMOJI[category.id] ?? '✨';

  return (
    <Link
      href={`/services/category/${category.id}`}
      className={cn('group block', className)}
    >
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition hover:shadow-lg hover:shadow-primary/10">
        <div
          className={cn(
            'relative overflow-hidden bg-gradient-to-br from-primary/15 to-accent/15',
            compact ? 'aspect-[3/2]' : 'aspect-[4/3]'
          )}
        >
          {isRemoteProductImage(cover ?? undefined) ? (
            <Image
              src={cover!}
              alt={category.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">{emoji}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className={cn('absolute bottom-0 left-0 right-0 text-white', compact ? 'p-3' : 'p-4')}>
            <h3 className={cn('font-semibold', compact ? 'text-base' : 'text-lg')}>{category.name}</h3>
            <p className="text-sm text-white/85">{count} services</p>
          </div>
        </div>
        {!compact && (
          <div className="flex items-center justify-between px-4 py-3">
            <p className="line-clamp-2 text-sm text-muted-foreground">{category.description}</p>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary opacity-0 transition group-hover:opacity-100" />
          </div>
        )}
      </div>
    </Link>
  );
}
