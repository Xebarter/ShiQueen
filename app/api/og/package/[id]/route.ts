import { getPackageForSeo } from '@/lib/seo/catalog-server';
import { resolvePackageOgImage } from '@/lib/metadata/resolve-package-og-image';
import { serveDefaultOgImage, serveRemoteImage } from '@/lib/og/serve-image';

export const runtime = 'nodejs';
export const revalidate = 86400;

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const pkg = await getPackageForSeo(id);
  const imageUrl = pkg?.isActive ? await resolvePackageOgImage(pkg) : undefined;

  if (imageUrl) {
    const photo = await serveRemoteImage(imageUrl);
    if (photo) return photo;
  }

  return serveDefaultOgImage();
}
