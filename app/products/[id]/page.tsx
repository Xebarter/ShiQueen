import type { Metadata } from 'next';
import { ProductDetailPage } from '@/components/product/product-detail-page';
import { getProduct } from '@/lib/firebase/products';
import {
  buildFallbackMetadata,
  buildProductMetadata,
} from '@/lib/metadata/catalog';
import { resolveProductOgImage } from '@/lib/metadata/resolve-og-image';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return buildFallbackMetadata('Product not found');
  }

  const imageUrl = resolveProductOgImage(product);
  return buildProductMetadata(product, imageUrl);
}

export default function ProductDetail() {
  return <ProductDetailPage />;
}
