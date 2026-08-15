import { getPackageForSeo } from '@/lib/seo/catalog-server';
import { resolvePackageOgImage } from '@/lib/metadata/resolve-package-og-image';
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
    const pkg = await getPackageForSeo(id);
    const imageUrl = pkg?.isActive ? await resolvePackageOgImage(pkg) : undefined;
    const version = pkg?.updatedAt?.getTime?.() ?? 0;

    return await renderShareOgImage({
      cacheKey: `package:${id}:${version}:${imageUrl ?? ''}`,
      imageUrl,
      title: pkg?.name,
      eyebrow: 'Package',
    });
  } catch {
    try {
      const pkg = await getPackageForSeo(id);
      const imageUrl = pkg?.isActive ? await resolvePackageOgImage(pkg) : undefined;
      if (imageUrl) {
        const remote = await serveRemoteImage(imageUrl);
        if (remote) return remote;
      }
    } catch {
      // Fall through to the brand mark only when the package photo is unavailable.
    }
    return serveDefaultOgImage();
  }
}
