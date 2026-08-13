import type { Metadata } from 'next';
import { ServiceDetailPage } from '@/components/services/service-detail-page';
import {
  buildFallbackMetadata,
  buildServiceMetadata,
  serviceCanonicalUrl,
} from '@/lib/metadata/catalog';
import { getServiceListingBySlugForSeo } from '@/lib/seo/catalog-server';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { breadcrumbJsonLd, JsonLd, serviceJsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/site';
import { BRAND_NAME } from '@/lib/brand';

type Props = {
  params: Promise<{ slug: string }>;
};

function listingImage(gallery?: string[]): string | undefined {
  return gallery?.find((item) => item.startsWith('http://') || item.startsWith('https://'));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getServiceListingBySlugForSeo(slug);

  if (!listing) {
    if (!isFirebaseAdminConfigured()) {
      const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return pageMetadata({
        title: `Book ${title}`,
        description: `Book ${title} in Kampala with ${BRAND_NAME} beauty services.`,
        path: `/services/${slug}`,
      });
    }
    return buildFallbackMetadata('Service not found');
  }

  return buildServiceMetadata(listing, listingImage(listing.galleryImages));
}

export default async function ServiceDetailRoute({ params }: Props) {
  const { slug } = await params;
  const listing = await getServiceListingBySlugForSeo(slug);
  const pathSlug = listing?.slug || listing?.id || slug;

  return (
    <>
      {listing ? (
        <JsonLd
          data={[
            serviceJsonLd({
              name: listing.name,
              description: listing.description,
              url: serviceCanonicalUrl(pathSlug),
              image: listingImage(listing.galleryImages),
              price: listing.basePrice,
              area: listing.location,
            }),
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Services', path: '/services' },
              { name: listing.name, path: `/services/${pathSlug}` },
            ]),
          ]}
        />
      ) : null}
      <ServiceDetailPage slug={slug} />
    </>
  );
}
