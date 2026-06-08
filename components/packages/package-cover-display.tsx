'use client';

import Image from 'next/image';
import { Boxes } from 'lucide-react';
import { isRemoteProductImage } from '@/components/product-image';
import { cn } from '@/lib/utils';

interface PackageCoverDisplayProps {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  fallbackClassName?: string;
}

export function PackageCoverDisplay({
  images,
  alt,
  className,
  imageClassName,
  sizes = '100vw',
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
        <Image
          src={validImages[0]}
          alt={alt}
          fill
          sizes={sizes}
          className={cn('object-cover', imageClassName)}
        />
      </div>
    );
  }

  if (validImages.length === 2) {
    return (
      <div className={cn('grid h-full w-full grid-cols-2 gap-0.5', className)}>
        {validImages.map((src, index) => (
          <div key={`${src}-${index}`} className="relative h-full min-h-0">
            <Image
              src={src}
              alt={`${alt} ${index + 1}`}
              fill
              sizes={sizes}
              className={cn('object-cover', imageClassName)}
            />
          </div>
        ))}
      </div>
    );
  }

  if (validImages.length === 3) {
    return (
      <div className={cn('grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5', className)}>
        <div className="relative row-span-2 h-full min-h-0">
          <Image
            src={validImages[0]}
            alt={`${alt} 1`}
            fill
            sizes={sizes}
            className={cn('object-cover', imageClassName)}
          />
        </div>
        <div className="relative h-full min-h-0">
          <Image
            src={validImages[1]}
            alt={`${alt} 2`}
            fill
            sizes={sizes}
            className={cn('object-cover', imageClassName)}
          />
        </div>
        <div className="relative h-full min-h-0">
          <Image
            src={validImages[2]}
            alt={`${alt} 3`}
            fill
            sizes={sizes}
            className={cn('object-cover', imageClassName)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5', className)}>
      {validImages.slice(0, 4).map((src, index) => (
        <div key={`${src}-${index}`} className="relative h-full min-h-0">
          <Image
            src={src}
            alt={`${alt} ${index + 1}`}
            fill
            sizes={sizes}
            className={cn('object-cover', imageClassName)}
          />
        </div>
      ))}
    </div>
  );
}
