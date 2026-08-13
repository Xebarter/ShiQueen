import { ImageResponse } from 'next/og';
import { getPackageForSeo } from '@/lib/seo/catalog-server';
import { fetchOgPhoto, loadBrandMark } from '@/lib/og/assets';
import { loadOgFonts } from '@/lib/og/fonts';
import { renderFallbackOgCard, renderPremiumOgCard } from '@/lib/og/premium-card';
import { OG_IMAGE_SIZE, OG_IMAGE_TYPE } from '@/lib/og/size';
import { resolvePackageOgImage } from '@/lib/metadata/resolve-package-og-image';
import { getPackageCategoryLabel } from '@/lib/package-catalog';
import { formatUGX } from '@/lib/wholesale-data';

export const runtime = 'nodejs';
export const revalidate = 3600;
export const alt = 'ShiQueen package';
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_TYPE;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PackageOgImage({ params }: Props): Promise<ImageResponse> {
  try {
    const { id } = await params;
    const [pkg, logo] = await Promise.all([getPackageForSeo(id), loadBrandMark()]);

    if (!pkg || !pkg.isActive) {
      const fonts = await loadOgFonts('ShiQueen');
      return renderFallbackOgCard(fonts, logo);
    }

    const photoUrl = await resolvePackageOgImage(pkg);
    const price = pkg.discountedPrice || pkg.basePrice;
    const [photo, fonts] = await Promise.all([
      fetchOgPhoto(photoUrl),
      loadOgFonts(`${pkg.name}${pkg.category ?? ''}${formatUGX(price)}`),
    ]);

    const hasDiscount = pkg.basePrice > price && pkg.basePrice > 0;

    return renderPremiumOgCard({
      title: pkg.name,
      kicker: pkg.category ? getPackageCategoryLabel(pkg.category) : 'Curated package',
      price: formatUGX(price),
      originalPrice: hasDiscount ? formatUGX(pkg.basePrice) : undefined,
      footer: pkg.tagline?.trim() || "Ladies' Lifestyle · Uganda",
      photo,
      logo,
      fonts,
    });
  } catch (error) {
    console.error('[ShiQueen] package OG image:', error);
    const [logo, fonts] = await Promise.all([loadBrandMark(), loadOgFonts('ShiQueen')]);
    return renderFallbackOgCard(fonts, logo);
  }
}
