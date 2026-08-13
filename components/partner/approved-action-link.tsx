'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ApprovedActionLink({
  allowed,
  href,
  children,
  className,
  variant = 'default',
  lockedHint = 'Available after admin approval',
}: {
  allowed: boolean;
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
  lockedHint?: string;
}) {
  const classes = cn(buttonVariants({ variant }), 'gap-1.5', className);

  if (!allowed) {
    return (
      <span className={cn(classes, 'cursor-not-allowed opacity-50')} title={lockedHint}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
