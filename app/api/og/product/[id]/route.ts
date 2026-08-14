import { NextResponse } from 'next/server';
import { getProductForSeo } from '@/lib/seo/catalog-server';
import { resolveProductOgImage } from '@/lib/metadata/resolve-og-image';
import { composeShareJpeg } from '@/lib/og/compose';
import { fetchOgPhotoBuffer } from '@/lib/og/photo';
import { CACHE_CONTROL, serveRemoteImage, serveDefaultOgImage } from '@/lib/og/serve-image';

export const runtime = 'nodejs';
export const revalidate = 86400;
export const maxDuration = 15;

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const product = await getProductForSeo(id);
  const imageUrl = product ? resolveProductOgImage(product) : undefined;
  const photo = imageUrl ? await fetchOgPhotoBuffer(imageUrl) : null;

  try {
    const jpeg = await composeShareJpeg({
      photo,
      title: product?.name,
      eyebrow: product?.category,
    });
    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': CACHE_CONTROL,
      },
    });
  } catch {
    if (imageUrl) {
      const original = await serveRemoteImage(imageUrl);
      if (original) return original;
    }
    return serveDefaultOgImage();
  }
}
