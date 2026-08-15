'use client';

import Image from 'next/image';
import { Boxes } from 'lucide-react';
import { isRemoteProductImage } from '@/components/product-image';
import { IMAGE_BLUR_DATA_URL, IMAGE_QUALITY } from '@/lib/image';
import { cn } from '@/lib/utils';

interface PackageCoverDisplayProps {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  fallbackClassName?: string;
}

function CoverImage({
  src,
  alt,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={IMAGE_QUALITY}
      placeholder="blur"
      blurDataURL={IMAGE_BLUR_DATA_URL}
      className={cn('object-cover', className)}
    />
  );
}

export function PackageCoverDisplay({
  images,
  alt,
  className,
  imageClassName,
  sizes = '(max-width: 768px) 100vw, 33vw',
  fallbackClassName,
}: PackageCoverDisplayProps) {
  const validImages = images.filter(isRemoteProductImage);

  if (validImages.length === 0) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center bg-muted text-muted-foreground',
          fallbackClassName,
          className
        )}
      >
        <Boxes className="h-10 w-10 opacity-30" />
      </div>
    );
  }

  if (validImages.length === 1) {
    return (
      <div className={cn('relative h-full w-full', className)}>
        <CoverImage src={validImages[0]!} alt={alt} sizes={sizes} className={imageClassName} />
      </div>
    );
  }

  if (validImages.length === 2) {
    return (
      <div className={cn('grid h-full w-full grid-cols-2 gap-0.5', className)}>
        {validImages.map((src, index) => (
          <div key={`${src}-${index}`} className="relative h-full min-h-0">
            <CoverImage src={src} alt={`${alt} ${index + 1}`} sizes={sizes} className={imageClassName} />
          </div>
        ))}
      </div>
    );
  }

  if (validImages.length === 3) {
    return (
      <div className={cn('grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5', className)}>
        <div className="relative row-span-2 h-full min-h-0">
          <CoverImage src={validImages[0]!} alt={`${alt} 1`} sizes={sizes} className={imageClassName} />
        </div>
        <div className="relative h-full min-h-0">
          <CoverImage src={validImages[1]!} alt={`${alt} 2`} sizes={sizes} className={imageClassName} />
        </div>
        <div className="relative h-full min-h-0">
          <CoverImage src={validImages[2]!} alt={`${alt} 3`} sizes={sizes} className={imageClassName} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5', className)}>
      {validImages.slice(0, 4).map((src, index) => (
        <div key={`${src}-${index}`} className="relative h-full min-h-0">
          <CoverImage src={src} alt={`${alt} ${index + 1}`} sizes={sizes} className={imageClassName} />
        </div>
      ))}
    </div>
  );
}
