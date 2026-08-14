import { getProductForSeo } from '@/lib/seo/catalog-server';
import { resolveProductOgImage } from '@/lib/metadata/resolve-og-image';
import { fetchOgPhotoSrc } from '@/lib/og/photo';
import { renderShareCard } from '@/lib/og/share-card';
import { serveDefaultOgImage } from '@/lib/og/serve-image';

export const runtime = 'nodejs';
export const revalidate = 86400;

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const product = await getProductForSeo(id);
  const imageUrl = product ? resolveProductOgImage(product) : undefined;
  const photoSrc = imageUrl ? await fetchOgPhotoSrc(imageUrl) : null;

  try {
    return await renderShareCard({
      photoSrc,
      title: product?.name,
      eyebrow: product?.category,
    });
  } catch {
    if (photoSrc) {
      try {
        return await renderShareCard({
          photoSrc: null,
          title: product?.name,
          eyebrow: product?.category,
        });
      } catch {
        return serveDefaultOgImage();
      }
    }
    return serveDefaultOgImage();
  }
}
