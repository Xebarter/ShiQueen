import { ImageResponse } from 'next/og';
import { getProductForSeo } from '@/lib/seo/catalog-server';
import { fetchOgPhoto, loadBrandMark } from '@/lib/og/assets';
import { loadOgFonts } from '@/lib/og/fonts';
import { renderFallbackOgCard, renderPremiumOgCard } from '@/lib/og/premium-card';
import { resolveProductOgImage } from '@/lib/metadata/resolve-og-image';
import { formatUGX } from '@/lib/wholesale-data';

export async function generateProductOgImage(id: string): Promise<ImageResponse> {
  try {
    const [product, logo] = await Promise.all([getProductForSeo(id), loadBrandMark()]);

    if (!product) {
      const fonts = await loadOgFonts();
      return renderFallbackOgCard(fonts, logo);
    }

    const photoUrl = resolveProductOgImage(product);
    const [photo, fonts] = await Promise.all([
      fetchOgPhoto(photoUrl),
      loadOgFonts(),
    ]);

    const hasDiscount =
      typeof product.originalPrice === 'number' && product.originalPrice > product.price;

    return renderPremiumOgCard({
      title: product.name,
      kicker: product.category || 'ShiQueen',
      price: formatUGX(product.price),
      originalPrice: hasDiscount ? formatUGX(product.originalPrice!) : undefined,
      photo,
      logo,
      fonts,
    });
  } catch (error) {
    console.error('[ShiQueen] product OG image:', error);
    const [logo, fonts] = await Promise.all([loadBrandMark(), loadOgFonts()]);
    return renderFallbackOgCard(fonts, logo);
  }
}
