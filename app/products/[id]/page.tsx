import type { Metadata } from 'next';
import { ProductDetailPage } from '@/components/product/product-detail-page';
import {
  buildFallbackMetadata,
  buildProductMetadata,
  productCanonicalUrl,
  productOgImagePath,
} from '@/lib/metadata/catalog';
import { resolveProductOgImage } from '@/lib/metadata/resolve-og-image';
import { getProductForSeo } from '@/lib/seo/catalog-server';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { breadcrumbJsonLd, JsonLd, productJsonLd } from '@/lib/seo/json-ld';
import { OG_IMAGE_SIZE } from '@/lib/og/size';
import { pageMetadata } from '@/lib/seo/site';
import { shopCategoryPath } from '@/lib/seo/shop-categories';
import { toAbsoluteUrl } from '@/lib/site-url';
import { BRAND_NAME } from '@/lib/brand';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForSeo(id);

  if (!product) {
    if (!isFirebaseAdminConfigured()) {
      return pageMetadata({
        title: 'Product',
        description: `Shop this product at ${BRAND_NAME}, a women's online shop in Uganda.`,
        path: `/products/${id}`,
        image: toAbsoluteUrl(productOgImagePath(id)),
        imageWidth: OG_IMAGE_SIZE.width,
        imageHeight: OG_IMAGE_SIZE.height,
      });
    }
    return buildFallbackMetadata('Product not found');
  }

  return buildProductMetadata(product);
}

export default async function ProductDetail({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductForSeo(id);
  const image = product ? resolveProductOgImage(product) : undefined;

  return (
    <>
      {product ? (
        <JsonLd
          data={[
            productJsonLd({
              name: product.name,
              description: product.description,
              url: productCanonicalUrl(product.id),
              image,
              sku: product.sku,
              price: product.price,
              availability: product.stock > 0 && product.status !== 'Out of Stock',
              rating: product.rating,
              reviewCount: product.reviews,
            }),
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Shop', path: '/shop' },
              { name: product.category || 'Products', path: shopCategoryPath(product.category) },
              { name: product.name, path: `/products/${product.id}` },
            ]),
          ]}
        />
      ) : null}
      <ProductDetailPage />
    </>
  );
}
