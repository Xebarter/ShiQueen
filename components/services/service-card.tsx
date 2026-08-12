'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BadgeCheck, Car, Clock, MapPin, MessageCircle, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildTelLink, buildWhatsAppLink, resolveListingImage } from '@/lib/services-utils';
import type { ServiceListing, ServiceProvider } from '@/lib/types/services';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

const CATEGORY_GRADIENTS: Record<string, string> = {
  'hair-services': 'from-rose-300/50 to-pink-100/80',
  'nail-services': 'from-fuchsia-300/40 to-rose-100/80',
  'makeup-services': 'from-rose-200/60 to-amber-100/70',
  'eyelash-eyebrow-services': 'from-violet-200/50 to-rose-100/70',
  'spa-wellness': 'from-teal-200/50 to-emerald-100/70',
  'skincare-services': 'from-sky-200/50 to-cyan-100/70',
  default: 'from-primary/25 to-accent/20',
};

interface ServiceCardProps {
  listing: ServiceListing;
  provider?: ServiceProvider;
  onBook?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
  index?: number;
}

export function ServiceCard({
  listing,
  provider,
  onBook,
  variant = 'default',
  className,
  index = 0,
}: ServiceCardProps) {
  const image = resolveListingImage(listing);
  const gradient = CATEGORY_GRADIENTS[listing.categoryId] ?? CATEGORY_GRADIENTS.default;
  const isCompact = variant === 'compact';
  const wa = provider?.whatsapp || provider?.phone;
  const waMessage = `Hi, I'm interested in ${listing.name} on SheQueen.`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10',
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
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className={cn('h-full bg-gradient-to-br', gradient)} />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {(listing.isFeatured || listing.isPopular) && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
              {listing.isFeatured ? 'Featured' : 'Popular'}
            </span>
          )}
          {listing.supportsMobile && (
            <span className="inline-flex items-center gap-1 rounded-md bg-background/95 px-2 py-0.5 text-[10px] font-semibold shadow-sm">
              <Car className="h-3 w-3" />
              Mobile
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <p className="text-sm font-semibold text-white drop-shadow-sm">
            {formatUGX(listing.basePrice)}
          </p>
          <span className="inline-flex items-center gap-1 rounded-md bg-black/35 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Clock className="h-3 w-3" />
            {listing.durationMinutes} min
          </span>
        </div>
      </Link>

      <div className={cn('flex flex-1 flex-col', isCompact ? 'p-3.5' : 'p-4')}>
        <Link href={`/services/${listing.slug}`}>
          <h3
            className={cn(
              'line-clamp-2 font-semibold leading-snug tracking-tight transition group-hover:text-primary',
              isCompact ? 'text-sm' : 'text-base'
            )}
          >
            {listing.name}
          </h3>
        </Link>
        {provider && (
          <p
            className={cn(
              'mt-1.5 flex items-center gap-1 text-muted-foreground',
              isCompact ? 'text-xs' : 'text-sm'
            )}
          >
            {provider.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
            <span className="truncate">{provider.businessName}</span>
          </p>
        )}
        <div
          className={cn(
            'mt-2 flex flex-wrap items-center gap-x-2 gap-y-1',
            isCompact ? 'text-xs' : 'text-sm'
          )}
        >
          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {listing.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{listing.location}</span>
          </span>
        </div>

        {provider && (
          <div className="mt-auto flex items-center gap-2 border-t border-border/50 pt-3">
            {onBook && (
              <Button
                type="button"
                size="sm"
                className="h-10 flex-1 rounded-xl font-semibold shadow-md shadow-primary/15"
                onClick={onBook}
              >
                Book &amp; pay
              </Button>
            )}
            <a href={buildTelLink(provider.phone)} aria-label="Call provider">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl"
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
                  className="h-10 w-10 shrink-0 rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}
