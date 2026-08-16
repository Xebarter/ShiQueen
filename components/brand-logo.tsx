import Image from 'next/image';
import Link from 'next/link';
import { BRAND_ASSETS, BRAND_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

const MARK_SIZES = {
  header: 'size-10',
  footer: 'size-10',
  auth: 'size-14',
  admin: 'size-9',
  icon: 'size-8',
} as const;

type BrandLogoVariant = keyof typeof MARK_SIZES;

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
  href?: string | null;
  showWordmark?: boolean;
  onClick?: () => void;
};

const WORDMARK_SCALE = {
  header: {
    shi: 'text-[1.4rem]',
    queen: 'text-[1.75rem]',
    underline: 'mt-1.5 h-[2px] w-full',
  },
  footer: {
    shi: 'text-[1.25rem]',
    queen: 'text-[1.55rem]',
    underline: 'mt-1.5 h-[2px] w-full',
  },
  auth: {
    shi: 'text-[2.1rem]',
    queen: 'text-[2.65rem]',
    underline: 'mt-2.5 h-[2px] w-32',
  },
  admin: null,
  icon: null,
} as const;

function ShiQueenWordmark({
  variant,
  className,
}: {
  variant: BrandLogoVariant;
  className?: string;
}) {
  const scale = WORDMARK_SCALE[variant];
  if (!scale) return null;

  const isFooter = variant === 'footer';
  const isAuth = variant === 'auth';

  return (
    <span
      className={cn('font-brand inline-flex flex-col leading-[0.95]', isAuth && 'items-center', className)}
    >
      <span className="sr-only">{BRAND_NAME}</span>
      <span aria-hidden="true" className="inline-flex items-baseline whitespace-nowrap select-none">
        <span
          className={cn(
            'relative -mr-px italic font-semibold text-primary',
            scale.shi
          )}
        >
          Shi
        </span>
        <span
          className={cn(
            'relative font-bold tracking-[0.04em] text-primary [text-shadow:0_1px_0_oklch(1_0_0/0.25)]',
            scale.queen
          )}
        >
          Queen
        </span>
      </span>
      <span
        className={cn(
          'block rounded-full bg-gradient-to-r from-primary/25 via-accent to-primary/25',
          scale.underline
        )}
        aria-hidden
      />
      {isFooter && (
        <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.32em] text-muted-foreground/90">
          Lifestyle
        </span>
      )}
    </span>
  );
}

export function BrandLogo({
  variant = 'header',
  className,
  href = '/',
  showWordmark = variant !== 'icon',
  onClick,
}: BrandLogoProps) {
  const isHeader = variant === 'header';

  const content = (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80',
          isHeader
            ? 'rounded-xl shadow-md shadow-primary/25 ring-1 ring-white/30 ring-inset'
            : 'rounded-lg',
          MARK_SIZES[variant]
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
      {showWordmark &&
        (variant === 'admin' ? (
          <span className="font-brand text-lg font-bold tracking-wide text-primary">
            {BRAND_NAME}
            <span className="mt-0.5 block font-sans text-xs font-normal tracking-normal text-muted-foreground">
              Admin
            </span>
          </span>
        ) : (
          <ShiQueenWordmark variant={variant} />
        ))}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="inline-flex shrink-0 transition-opacity hover:opacity-90"
        aria-label={`${BRAND_NAME} home`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
