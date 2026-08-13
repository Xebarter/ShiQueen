import { getProductForSeo } from '@/lib/seo/catalog-server';
import { resolveProductOgImage } from '@/lib/metadata/resolve-og-image';
import { serveDefaultOgImage, serveRemoteImage } from '@/lib/og/serve-image';

export const runtime = 'nodejs';
export const revalidate = 86400;

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const product = await getProductForSeo(id);
  const imageUrl = product ? resolveProductOgImage(product) : undefined;

  if (imageUrl) {
    const photo = await serveRemoteImage(imageUrl);
    if (photo) return photo;
  }

  return serveDefaultOgImage();
}
