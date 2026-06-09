'use client';

import { useCallback } from 'react';
import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '@/lib/types/database';
import type { Package } from '@/lib/types/wholesale';
import { Button } from '@/components/ui/button';
import { buildShareUrl, shareOrCopy } from '@/lib/share';
import { cn } from '@/lib/utils';

type ShareButtonProps = {
  title: string;
  path: string;
  text?: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  'aria-label'?: string;
};

export function ShareButton({
  title,
  path,
  text,
  variant = 'icon',
  size = 'sm',
  className,
  'aria-label': ariaLabel = 'Share',
}: ShareButtonProps) {
  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const url = buildShareUrl(path);
      const result = await shareOrCopy({ title, text, url });

      if (result === 'copied') {
        toast.success('Link copied to clipboard');
      }
    },
    [path, text, title]
  );

  if (variant === 'button') {
    return (
      <Button
        type="button"
        variant="outline"
        size={size === 'icon' ? 'default' : size}
        onClick={handleShare}
        className={cn('gap-2', className)}
        aria-label={ariaLabel}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-border/50 bg-background/70 p-2 text-muted-foreground backdrop-blur-md transition hover:bg-background hover:text-foreground',
        className
      )}
      aria-label={ariaLabel}
    >
      <Share2 className="h-4 w-4" />
    </button>
  );
}

export function ShareProductButton({
  product,
  variant,
  className,
  size,
}: {
  product: Product;
  variant?: ShareButtonProps['variant'];
  className?: string;
  size?: ShareButtonProps['size'];
}) {
  return (
    <ShareButton
      title={product.name}
      text={product.description}
      path={`/products/${product.id}`}
      variant={variant}
      className={className}
      size={size}
    />
  );
}

export function SharePackageButton({
  pkg,
  variant,
  className,
  size,
}: {
  pkg: Package;
  variant?: ShareButtonProps['variant'];
  className?: string;
  size?: ShareButtonProps['size'];
}) {
  return (
    <ShareButton
      title={pkg.name}
      text={pkg.tagline || pkg.description}
      path={`/packages/${pkg.id}`}
      variant={variant}
      className={className}
      size={size}
    />
  );
}
