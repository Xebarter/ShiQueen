import type { Package } from '@/lib/types/wholesale';
import { isCustomPackageItem } from '@/lib/package-utils';
import { getProductForSeo } from '@/lib/seo/catalog-server';
import { resolveProductOgImage, toOgImageUrl } from '@/lib/metadata/resolve-og-image';

async function resolveProductIdImage(productId: string): Promise<string | undefined> {
  const product = await getProductForSeo(productId);
  if (!product) return undefined;
  return resolveProductOgImage(product);
}

export async function resolvePackageOgImage(pkg: Package): Promise<string | undefined> {
  const uploadedCover = toOgImageUrl(pkg.image);
  if (uploadedCover) return uploadedCover;

  if (pkg.coverProductIds?.length) {
    for (const productId of pkg.coverProductIds) {
      const image = await resolveProductIdImage(productId);
      if (image) return image;
    }
  }

  for (const item of pkg.items) {
    if (isCustomPackageItem(item)) {
      const customImage = toOgImageUrl(item.customImage);
      if (customImage) return customImage;
      continue;
    }
    const image = await resolveProductIdImage(item.productId);
    if (image) return image;
  }

  return undefined;
}
