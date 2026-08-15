'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { isRemoteProductImage } from '@/components/product-image';
import type { ServiceCategory, ServiceListing, ServiceProvider } from '@/lib/types/services';
import { countCategoryServices, resolveCategoryCoverImage } from '@/lib/services-utils';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: ServiceCategory;
  listings: ServiceListing[];
  providers?: ServiceProvider[];
  compact?: boolean;
  className?: string;
}

export function CategoryCard({
  category,
  listings,
  providers = [],
  compact,
  className,
}: CategoryCardProps) {
  const cover = resolveCategoryCoverImage(category.id, listings, providers);
  const count = countCategoryServices(category.id, listings);

  return (
    <Link href={`/services/category/${category.id}`} className={cn('group block', className)}>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/10">
        <div
          className={cn(
            'relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-accent/20',
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.25),transparent_55%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          <div className={cn('absolute bottom-0 left-0 right-0 text-white', compact ? 'p-3.5' : 'p-4')}>
            <h3 className={cn('font-semibold tracking-tight', compact ? 'text-base' : 'text-lg')}>
              {category.name}
            </h3>
            <p className="mt-0.5 text-sm text-white/85">
              {count} service{count === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        {!compact && (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="line-clamp-2 text-sm text-muted-foreground">{category.description}</p>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary opacity-0 transition group-hover:opacity-100" />
          </div>
        )}
      </div>
    </Link>
  );
}
