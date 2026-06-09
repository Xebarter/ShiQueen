import type { Metadata } from 'next';
import { PackageDetailPage } from '@/components/packages/package-detail-page';
import { getPackage } from '@/lib/firebase/wholesale';
import {
  buildFallbackMetadata,
  buildPackageMetadata,
} from '@/lib/metadata/catalog';
import { resolvePackageOgImage } from '@/lib/metadata/resolve-og-image';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const pkg = await getPackage(id);

  if (!pkg || !pkg.isActive) {
    return buildFallbackMetadata('Bundle not found');
  }

  const imageUrl = await resolvePackageOgImage(pkg);
  return buildPackageMetadata(pkg, imageUrl);
}

export default function PackageDetail() {
  return <PackageDetailPage />;
}
