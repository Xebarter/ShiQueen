import { ImageResponse } from 'next/og';
import { getProductForSeo } from '@/lib/seo/catalog-server';
import { fetchOgPhoto, loadBrandMark } from '@/lib/og/assets';
import { loadOgFonts } from '@/lib/og/fonts';
import { renderFallbackOgCard, renderPremiumOgCard } from '@/lib/og/premium-card';
import { OG_IMAGE_SIZE, OG_IMAGE_TYPE } from '@/lib/og/size';
import { resolveProductOgImage } from '@/lib/metadata/resolve-og-image';
import { formatUGX } from '@/lib/wholesale-data';

export const runtime = 'nodejs';
export const revalidate = 3600;
export const alt = 'ShiQueen product';
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_TYPE;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductOgImage({ params }: Props): Promise<ImageResponse> {
  try {
    const { id } = await params;
    const [product, logo] = await Promise.all([getProductForSeo(id), loadBrandMark()]);

    if (!product) {
      const fonts = await loadOgFonts('ShiQueen');
      return renderFallbackOgCard(fonts, logo);
    }

    const photoUrl = resolveProductOgImage(product);
    const [photo, fonts] = await Promise.all([
      fetchOgPhoto(photoUrl),
      loadOgFonts(`${product.name}${product.category}${formatUGX(product.price)}`),
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
    const [logo, fonts] = await Promise.all([loadBrandMark(), loadOgFonts('ShiQueen')]);
    return renderFallbackOgCard(fonts, logo);
  }
}
