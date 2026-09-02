import type { Metadata } from 'next';
import { PackageDetailPage } from '@/components/packages/package-detail-page';
import {
  buildFallbackMetadata,
  buildPackageMetadata,
  packageCanonicalUrl,
  packageOgImagePath,
} from '@/lib/metadata/catalog';
import { resolvePackageOgImage } from '@/lib/metadata/resolve-package-og-image';
import { getPackageForSeo } from '@/lib/seo/catalog-server';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { breadcrumbJsonLd, JsonLd, productJsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/site';
import { toAbsoluteUrl } from '@/lib/site-url';
import { BRAND_NAME } from '@/lib/brand';
import { assertPublicFeature } from '@/lib/supabase/feature-flags-server';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await assertPublicFeature('packages');
  const { id } = await params;
  const pkg = await getPackageForSeo(id);

  if (!pkg || !pkg.isActive) {
    if (!isFirebaseAdminConfigured()) {
      return pageMetadata({
        title: 'Beauty package',
        description: `Shop this beauty package at ${BRAND_NAME} in Kampala, Uganda.`,
        path: `/packages/${id}`,
        image: toAbsoluteUrl(packageOgImagePath(id)),
      });
    }
    return buildFallbackMetadata('Bundle not found');
  }

  return await buildPackageMetadata(pkg);
}

export default async function PackageDetail({ params }: PageProps) {
  await assertPublicFeature('packages');
  const { id } = await params;
  const pkg = await getPackageForSeo(id);
  const imageUrl = pkg ? await resolvePackageOgImage(pkg) : undefined;

  return (
    <>
      {pkg && pkg.isActive ? (
        <JsonLd
          data={[
            productJsonLd({
              name: pkg.name,
              description: pkg.tagline || pkg.description,
              url: packageCanonicalUrl(pkg.id),
              image: imageUrl,
              price: pkg.discountedPrice || pkg.basePrice,
              availability: pkg.isActive,
            }),
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Packages', path: '/packages' },
              { name: pkg.name, path: `/packages/${pkg.id}` },
            ]),
          ]}
        />
      ) : null}
      <PackageDetailPage />
      {pkg && pkg.isActive ? (
        <noscript>
          <article>
            <h1>{pkg.name}</h1>
            <p>{pkg.tagline || pkg.description}</p>
            <p>
              {(pkg.discountedPrice || pkg.basePrice)} UGX at {BRAND_NAME}.
            </p>
            <p>
              <a href="/packages">All packages</a>
            </p>
          </article>
        </noscript>
      ) : null}
    </>
  );
}
