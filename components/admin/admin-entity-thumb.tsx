import Image from 'next/image';
import { isRemoteProductImage } from '@/components/product-image';
import { cn } from '@/lib/utils';

export function AdminEntityThumb({
  src,
  label,
  className,
  sizeClassName = 'h-20 w-20',
  sizes = '80px',
}: {
  src?: string | null;
  label: string;
  className?: string;
  sizeClassName?: string;
  sizes?: string;
}) {
  const initial = label.trim().charAt(0).toUpperCase() || '?';
  const showImage = isRemoteProductImage(src);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-2xl bg-primary/10 text-primary ring-1 ring-border/50',
        sizeClassName,
        className
      )}
    >
      {showImage ? (
        <Image src={src!} alt="" fill className="object-cover" sizes={sizes} />
      ) : (
        <div className="flex h-full items-center justify-center text-lg font-semibold">
          {initial}
        </div>
      )}
    </div>
  );
}
