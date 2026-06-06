import Image from 'next/image';
import Link from 'next/link';
import { BRAND_ASSETS, BRAND_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

const MARK_SIZES = {
  header: 'size-9',
  footer: 'size-10',
  auth: 'size-14',
  admin: 'size-9',
  icon: 'size-8',
} as const;

const WORDMARK_SIZES = {
  header: 'text-xl',
  footer: 'text-xl',
  auth: 'text-2xl',
  admin: 'text-lg font-semibold',
  icon: '',
} as const;

type BrandLogoVariant = keyof typeof MARK_SIZES;

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
  href?: string | null;
  showWordmark?: boolean;
  onClick?: () => void;
};

export function BrandLogo({
  variant = 'header',
  className,
  href = '/',
  showWordmark = variant !== 'icon',
  onClick,
}: BrandLogoProps) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary',
          MARK_SIZES[variant],
        )}
      >
        <Image
          src={BRAND_ASSETS.icon192}
          alt=""
          width={192}
          height={192}
          className="size-full object-cover"
          priority={variant === 'header' || variant === 'auth'}
        />
      </span>
      {showWordmark && (
        <span className={cn('font-light tracking-wider text-primary', WORDMARK_SIZES[variant])}>
          {variant === 'admin' ? (
            <>
              {BRAND_NAME}
              <span className="mt-0.5 block text-xs font-normal tracking-normal text-muted-foreground">
                Admin
              </span>
            </>
          ) : (
            BRAND_NAME
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="inline-flex shrink-0"
        aria-label={`${BRAND_NAME} home`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
