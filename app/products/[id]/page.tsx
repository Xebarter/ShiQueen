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
import { isRetailCatalogProduct } from '@/lib/product-channels';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { breadcrumbJsonLd, JsonLd, productJsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/site';
import { shopCategoryPath } from '@/lib/seo/shop-categories';
import { toAbsoluteUrl } from '@/lib/site-url';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';

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
        description: `Shop this at ${BRAND_NAME}.`,
        path: `/products/${id}`,
        image: toAbsoluteUrl(productOgImagePath(id)),
        imageWidth: 1200,
        imageHeight: 1200,
      });
    }
    return buildFallbackMetadata('Product not found');
  }

  return buildProductMetadata(product);
}

export default async function ProductDetail({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductForSeo(id);
  const image = product && isRetailCatalogProduct(product) ? resolveProductOgImage(product) : undefined;
  const indexable = Boolean(product && isRetailCatalogProduct(product));

  return (
    <>
      {indexable && product ? (
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
      {indexable && product ? (
        <noscript>
          <article>
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            <p>
              {product.price} UGX · {product.stock > 0 && product.status !== 'Out of Stock' ? 'In stock' : 'Out of stock'} at {BRAND_NAME}.
            </p>
            <p>
              <a href={shopCategoryPath(product.category)}>Back to shop</a>
            </p>
          </article>
        </noscript>
      ) : null}
    </>
  );
}
