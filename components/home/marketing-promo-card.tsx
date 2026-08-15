'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingAd } from '@/lib/types/database';
import { Product } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { isRemoteProductImage } from '@/components/product-image';
import { ShareProductButton } from '@/components/shared/share-button';
import { cn } from '@/lib/utils';

type MarketingPromoCardProps = {
  ad: MarketingAd;
  product: Product;
  className?: string;
  compact?: boolean;
};

export function MarketingPromoCard({ ad, product, className, compact = false }: MarketingPromoCardProps) {
  const headline = ad.headline.trim() || product.name;
  const subheadline =
    ad.subheadline.trim() ||
    product.description.slice(0, compact ? 120 : 160) ||
    `Explore ${product.category.toLowerCase()} curated for you.`;
  const hasDiscount =
    product.originalPrice !== undefined && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg ring-1 ring-border/40',
        className
      )}
    >
      <div className={cn('relative', compact ? 'min-h-[12rem] sm:min-h-[14rem]' : 'min-h-[22rem] md:min-h-[24rem]')}>
        {isRemoteProductImage(ad.bannerImage) ? (
          <Image
            src={ad.bannerImage}
            alt={headline}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={75}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary to-accent/20" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/25 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col justify-end p-5 sm:p-6 md:p-8">
          <div className="mb-auto flex flex-wrap items-center gap-2 pt-1">
            {ad.badgeText && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-accent-foreground shadow-sm">
                <Sparkles className="h-3 w-3" />
                {ad.badgeText}
              </span>
            )}
            {hasDiscount && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground">
                <Tag className="h-3 w-3" />
                {discountPercent}% off
              </span>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
              {product.category}
            </p>
            <h2
              className={cn(
                'font-light tracking-tight text-white',
                compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.08]'
              )}
            >
              {headline}
            </h2>
            {!compact && (
              <p className="max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">{subheadline}</p>
            )}

            <div className="flex flex-wrap items-end gap-3 pt-1">
              <div>
                <p className="text-2xl font-semibold text-white">{formatUGX(product.price)}</p>
              </div>
              {!compact && product.rating > 0 && (
                <p className="text-xs text-white/70">
                  ★ {product.rating.toFixed(1)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={`/products/${product.id}`}>
                <Button size={compact ? 'default' : 'lg'} className="gap-2 shadow-lg">
                  {ad.ctaLabel || 'Shop'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {!compact && (
                <>
                  <ShareProductButton
                    product={product}
                    variant="button"
                    size="lg"
                    className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                  />
                  <Link href="/shop">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                    >
                      Browse
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function MarketingPromoFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-[14rem] flex-col items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 text-center',
        className
      )}
    >
      <Sparkles className="mb-2 h-7 w-7 text-accent" />
      <Link href="/shop">
        <Button className="gap-2">
          Shop now
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
