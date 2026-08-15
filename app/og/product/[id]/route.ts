import { getProductForSeo } from '@/lib/seo/catalog-server';
import { resolveProductOgImage } from '@/lib/metadata/resolve-og-image';
import { ogHeadResponse, ogRouteId, renderShareOgImage } from '@/lib/og/render';
import { serveDefaultOgImage, serveRemoteImage } from '@/lib/og/serve-image';

export const runtime = 'nodejs';
export const revalidate = 86400;
export const maxDuration = 15;

type Props = {
  params: Promise<{ id: string }>;
};

export async function HEAD() {
  return ogHeadResponse();
}

export async function GET(_request: Request, { params }: Props) {
  const { id: rawId } = await params;
  const id = ogRouteId(rawId);

  try {
    const product = await getProductForSeo(id);
    const imageUrl = product ? resolveProductOgImage(product) : undefined;
    const version = product?.updatedAt?.getTime?.() ?? 0;

    return await renderShareOgImage({
      cacheKey: `product:${id}:${version}:${imageUrl ?? ''}`,
      imageUrl,
      title: product?.name,
      eyebrow: product?.category,
    });
  } catch {
    try {
      const product = await getProductForSeo(id);
      const imageUrl = product ? resolveProductOgImage(product) : undefined;
      if (imageUrl) {
        const remote = await serveRemoteImage(imageUrl);
        if (remote) return remote;
      }
    } catch {
      // Fall through to the brand mark only when the product photo is unavailable.
    }
    return serveDefaultOgImage();
  }
}
