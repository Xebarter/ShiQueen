import { ImageResponse } from 'next/og';
import { getPackageForSeo } from '@/lib/seo/catalog-server';
import { fetchOgPhoto, loadBrandMark } from '@/lib/og/assets';
import { loadOgFonts } from '@/lib/og/fonts';
import { renderFallbackOgCard, renderPremiumOgCard } from '@/lib/og/premium-card';
import { resolvePackageOgImage } from '@/lib/metadata/resolve-package-og-image';
import { getPackageCategoryLabel } from '@/lib/package-catalog';
import { formatUGX } from '@/lib/wholesale-data';

export async function generatePackageOgImage(id: string): Promise<ImageResponse> {
  try {
    const [pkg, logo] = await Promise.all([getPackageForSeo(id), loadBrandMark()]);

    if (!pkg || !pkg.isActive) {
      const fonts = await loadOgFonts();
      return renderFallbackOgCard(fonts, logo);
    }

    const photoUrl = await resolvePackageOgImage(pkg);
    const price = pkg.discountedPrice || pkg.basePrice;
    const [photo, fonts] = await Promise.all([fetchOgPhoto(photoUrl), loadOgFonts()]);

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
    const [logo, fonts] = await Promise.all([loadBrandMark(), loadOgFonts()]);
    return renderFallbackOgCard(fonts, logo);
  }
}
