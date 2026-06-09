import type { Product } from '@/lib/types/database';
import type { Package } from '@/lib/types/wholesale';
import { isRemoteProductImage } from '@/components/product-image';
import { getProduct } from '@/lib/firebase/products';
import { isCustomPackageItem } from '@/lib/package-utils';
import { toAbsoluteUrl } from '@/lib/site-url';

function toOgImageUrl(src?: string): string | undefined {
  if (!isRemoteProductImage(src)) return undefined;
  return src;
}

export function resolveProductOgImage(product: Product): string | undefined {
  return toOgImageUrl(product.image);
}

async function resolveProductIdImage(productId: string): Promise<string | undefined> {
  const product = await getProduct(productId);
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

export function getDefaultOgImageUrl(): string {
  return toAbsoluteUrl('/web-app-manifest-512x512.png');
}
