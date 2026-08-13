import { generateProductOgImage } from '@/lib/og/generate-product-image';

export const runtime = 'nodejs';
export const revalidate = 3600;
export const alt = 'ShiQueen product';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Image({ params }: Props) {
  const { id } = await params;
  return generateProductOgImage(id);
}
