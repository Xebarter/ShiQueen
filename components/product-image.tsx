import Image from 'next/image';
import { Product } from '@/lib/types/database';
import { CARD_IMAGE_SIZES, IMAGE_BLUR_DATA_URL, IMAGE_QUALITY } from '@/lib/image';
import { cn } from '@/lib/utils';

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
};

export function ProductImage({
  product,
  className,
  imageClassName,
  fallbackClassName,
  sizes = CARD_IMAGE_SIZES,
  priority = false,
}: ProductImageProps) {
  const emoji = CATEGORY_EMOJI[product.category] ?? '🛍️';

  if (isRemoteProductImage(product.image)) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <Image
          src={product.image}
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
