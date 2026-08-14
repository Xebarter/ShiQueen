import { getPackageForSeo } from '@/lib/seo/catalog-server';
import { resolvePackageOgImage } from '@/lib/metadata/resolve-package-og-image';
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
  const pkg = await getPackageForSeo(id);
  const imageUrl = pkg?.isActive ? await resolvePackageOgImage(pkg) : undefined;
  const photoSrc = imageUrl ? await fetchOgPhotoSrc(imageUrl) : null;

  try {
    return await renderShareCard({
      photoSrc,
      title: pkg?.name,
      eyebrow: 'Package',
    });
  } catch {
    if (photoSrc) {
      try {
        return await renderShareCard({
          photoSrc: null,
          title: pkg?.name,
          eyebrow: 'Package',
        });
      } catch {
        return serveDefaultOgImage();
      }
    }
    return serveDefaultOgImage();
  }
}
