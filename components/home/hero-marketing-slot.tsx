'use client';

import { useMarketingAds } from '@/lib/marketing-ads-context';
import { useProducts } from '@/lib/products-context';
import { MarketingAdPlacement } from '@/lib/types/database';
import { MarketingPromoCard, MarketingPromoFallback } from '@/components/home/marketing-promo-card';

type HeroMarketingSlotProps = {
  placement: MarketingAdPlacement;
  compact?: boolean;
};

export function HeroMarketingSlot({ placement, compact }: HeroMarketingSlotProps) {
  const { getActiveAd, loading: adsLoading } = useMarketingAds();
  const { getProductById, loading: productsLoading } = useProducts();

  const ad = getActiveAd(placement);
  const product = ad ? getProductById(ad.productId) : undefined;

  if (adsLoading || productsLoading) {
    return (
      <div
        className={`animate-pulse rounded-3xl bg-secondary/60 ${compact ? 'min-h-[20rem]' : 'min-h-[22rem] md:min-h-[24rem]'}`}
      />
    );
  }

  if (ad && product) {
    return <MarketingPromoCard ad={ad} product={product} compact={compact} />;
  }

  return <MarketingPromoFallback />;
}
