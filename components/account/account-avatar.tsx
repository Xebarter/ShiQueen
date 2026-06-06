import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  getAvatarColorsForLetter,
  getDisplayName,
  getEmailInitial,
  getInitials,
} from '@/lib/user-display';

type AccountAvatarProps = {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  size?: 'sm' | 'md';
  /** Single email letter with a unique bright color per letter (Google-style). */
  variant?: 'default' | 'email-letter';
  className?: string;
};

const SIZES = {
  sm: { size: 'size-9', text: 'text-base', image: 36 },
  md: { size: 'size-12', text: 'text-xl', image: 48 },
} as const;

export function AccountAvatar({
  displayName,
  email,
  photoURL,
  size = 'sm',
  variant = 'default',
  className,
}: AccountAvatarProps) {
  const name = getDisplayName(displayName, email);
  const { size: sizeClass, text, image } = SIZES[size];
  const useEmailLetter = variant === 'email-letter';

  if (useEmailLetter) {
    const initial = getEmailInitial(email);
    const colors = getAvatarColorsForLetter(initial);

    return (
      <span
        className={cn(
          sizeClass,
          'inline-flex shrink-0 aspect-square select-none items-center justify-center overflow-hidden rounded-full',
          'border-2 border-background font-semibold leading-none',
          'shadow-sm ring-1 ring-border/60',
          text,
          className
        )}
        style={{
          backgroundColor: colors.background,
          color: colors.foreground,
        }}
        aria-hidden
      >
        {initial}
      </span>
    );
  }

  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt={name}
        width={image}
        height={image}
        className={cn(sizeClass, 'rounded-full object-cover ring-1 ring-border', className)}
      />
    );
  }

  return (
    <span
      className={cn(
        sizeClass,
        'inline-flex aspect-square items-center justify-center overflow-hidden rounded-full bg-primary/10 font-medium text-primary ring-1 ring-primary/15',
        text,
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}
