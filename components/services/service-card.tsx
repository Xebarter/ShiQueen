'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, Car, MapPin, MessageCircle, Phone, Star } from 'lucide-react';
import { isRemoteProductImage } from '@/components/product-image';
import { Button } from '@/components/ui/button';
import { buildTelLink, buildWhatsAppLink, resolveListingImage } from '@/lib/services-utils';
import type { ServiceListing, ServiceProvider } from '@/lib/types/services';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

const CATEGORY_GRADIENTS: Record<string, string> = {
  'hair-services': 'from-rose-200/80 to-pink-100',
  'nail-services': 'from-fuchsia-200/70 to-rose-100',
  'makeup-services': 'from-purple-200/70 to-pink-100',
  'eyelash-eyebrow-services': 'from-violet-200/70 to-fuchsia-100',
  'spa-wellness': 'from-teal-200/60 to-emerald-100',
  'skincare-services': 'from-sky-200/60 to-cyan-100',
  default: 'from-primary/20 to-accent/20',
};

interface ServiceCardProps {
  listing: ServiceListing;
  provider?: ServiceProvider;
  onBook?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export function ServiceCard({
  listing,
  provider,
  onBook,
  variant = 'default',
  className,
}: ServiceCardProps) {
  const image = resolveListingImage(listing);
  const gradient = CATEGORY_GRADIENTS[listing.categoryId] ?? CATEGORY_GRADIENTS.default;
  const isCompact = variant === 'compact';
  const wa = provider?.whatsapp || provider?.phone;
  const waMessage = `Hi, I'm interested in ${listing.name} on SheQueen.`;

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/10',
        className
      )}
    >
      <Link
        href={`/services/${listing.slug}`}
        className={cn(
          'relative block overflow-hidden',
          isCompact ? 'aspect-[16/10]' : 'aspect-[4/3]'
        )}
      >
        {image ? (
          <Image
            src={image}
            alt={listing.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className={cn('flex h-full items-center justify-center bg-gradient-to-br', gradient)}>
            <span className={cn('opacity-80', isCompact ? 'text-4xl' : 'text-5xl')}>✨</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {(listing.isFeatured || listing.isPopular) && (
            <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              {listing.isFeatured ? 'Featured' : 'Popular'}
            </span>
          )}
          {listing.supportsMobile && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm">
              <Car className="h-3 w-3" />
              Mobile
            </span>
          )}
          {provider?.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>
      </Link>

      <div className={cn('flex flex-1 flex-col', isCompact ? 'p-3' : 'p-4')}>
        <Link href={`/services/${listing.slug}`}>
          <h3
            className={cn(
              'line-clamp-2 font-semibold leading-snug group-hover:text-primary',
              isCompact ? 'text-sm' : 'text-base'
            )}
          >
            {listing.name}
          </h3>
        </Link>
        {listing.serviceType && (
          <span className="mt-1.5 inline-flex w-fit rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {listing.serviceType}
          </span>
        )}
        {provider && (
          <p className={cn('mt-1 text-muted-foreground', isCompact ? 'text-xs' : 'text-sm')}>
            {provider.businessName}
          </p>
        )}
        <div className={cn('mt-2 flex flex-wrap items-center gap-2', isCompact ? 'text-xs' : 'text-sm')}>
          <span className="inline-flex items-center gap-1 font-medium text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {listing.rating.toFixed(1)}
          </span>
          {listing.reviewCount > 0 && (
            <span className="text-muted-foreground">({listing.reviewCount} reviews)</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{listing.location}</span>
        </div>
        <p className={cn('mt-2 font-bold tabular-nums text-primary', isCompact ? 'text-base' : 'text-lg')}>
          From {formatUGX(listing.basePrice)}
        </p>
        {provider && (
          <div className="mt-auto flex items-center gap-2 border-t border-border/50 pt-3">
            {onBook && (
              <Button
                type="button"
                size="sm"
                className="h-9 flex-1 rounded-xl shadow-md shadow-primary/15"
                onClick={onBook}
              >
                Book Now
              </Button>
            )}
            <a href={buildTelLink(provider.phone)} aria-label="Call provider">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl"
              >
                <Phone className="h-4 w-4" />
              </Button>
            </a>
            {wa && (
              <a
                href={buildWhatsAppLink(wa, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp provider"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
