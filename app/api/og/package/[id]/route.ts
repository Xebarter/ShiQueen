import { getPackageForSeo } from '@/lib/seo/catalog-server';
import { resolvePackageOgImage } from '@/lib/metadata/resolve-package-og-image';
import { renderShareOgImage } from '@/lib/og/render';

export const runtime = 'nodejs';
export const revalidate = 86400;
export const maxDuration = 15;

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const pkg = await getPackageForSeo(id);
  const imageUrl = pkg?.isActive ? await resolvePackageOgImage(pkg) : undefined;
  const version = pkg?.updatedAt?.getTime?.() ?? 0;

  return renderShareOgImage({
    cacheKey: `package:${id}:${version}:${imageUrl ?? ''}`,
    imageUrl,
    title: pkg?.name,
    eyebrow: 'Package',
  });
}
