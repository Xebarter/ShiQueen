import type { Metadata } from 'next';
import { CategoryPage } from '@/components/services/category-page';
import { buildFallbackMetadata, buildServiceCategoryMetadata } from '@/lib/metadata/catalog';
import { getServiceCategoryForSeo } from '@/lib/seo/catalog-server';
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { assertPublicFeature } from '@/lib/supabase/feature-flags-server';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await assertPublicFeature('services');
  const { slug } = await params;
  const category = await getServiceCategoryForSeo(slug);
  if (!category) {
    return buildFallbackMetadata('Service category');
  }
  return buildServiceCategoryMetadata(category);
}

export default async function ServiceCategoryRoute({ params }: Props) {
  await assertPublicFeature('services');
  const { slug } = await params;
  const category = await getServiceCategoryForSeo(slug);

  return (
    <>
      {category ? (
        <JsonLd
          data={breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
            { name: category.name, path: `/services/category/${category.id}` },
          ])}
        />
      ) : null}
      <CategoryPage slug={slug} />
    </>
  );
}
