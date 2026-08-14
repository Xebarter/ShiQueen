import { getProductForSeo } from '@/lib/seo/catalog-server';
import { resolveProductOgImage } from '@/lib/metadata/resolve-og-image';
import { renderShareOgImage } from '@/lib/og/render';
import { serveDefaultOgImage } from '@/lib/og/serve-image';

export const runtime = 'nodejs';
export const revalidate = 86400;
export const maxDuration = 15;

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  try {
    const { id } = await params;
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
    return serveDefaultOgImage();
  }
}
