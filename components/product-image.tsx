import Image from 'next/image';
import { Product } from '@/lib/types/database';
import { CARD_IMAGE_SIZES, IMAGE_BLUR_DATA_URL, IMAGE_QUALITY } from '@/lib/image';
import { cn } from '@/lib/utils';
import { productImageVariant } from '@/lib/image-optimization/variants';
import type { ImageVariantName } from '@/lib/image-optimization/config';

const CATEGORY_EMOJI: Record<string, string> = {
  Beauty: '✨',
  Clothing: '👗',
  Accessories: '👜',
  Wellness: '🧘',
  Home: '🏠',
};

export function isRemoteProductImage(src?: string): boolean {
  return Boolean(src && (src.startsWith('http://') || src.startsWith('https://')));
}

type ProductImageProps = {
  product: Pick<Product, 'image' | 'category' | 'name'>;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  sizes?: string;
  priority?: boolean;
  variant?: ImageVariantName;
};

export function ProductImage({
  product,
  className,
  imageClassName,
  fallbackClassName,
  sizes = CARD_IMAGE_SIZES,
  priority = false,
  variant = 'card',
}: ProductImageProps) {
  const emoji = CATEGORY_EMOJI[product.category] ?? '🛍️';
  const src = productImageVariant(product.image, variant);

  if (isRemoteProductImage(src)) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <Image
          src={src}
          alt={product.name}
          fill
          sizes={sizes}
          quality={IMAGE_QUALITY}
          priority={priority}
          placeholder="blur"
          blurDataURL={IMAGE_BLUR_DATA_URL}
          className={cn('object-cover', imageClassName)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary to-accent/10',
        className
      )}
    >
      <span className={cn('text-5xl opacity-30 select-none', fallbackClassName)}>{emoji}</span>
    </div>
  );
}
