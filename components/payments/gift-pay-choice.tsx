'use client';

import { Gift, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GiftPayMode = 'self' | 'gift';

interface GiftPayChoiceProps {
  mode: GiftPayMode;
  onChange: (mode: GiftPayMode) => void;
  selfLabel?: string;
  giftLabel?: string;
  selfDescription?: string;
  giftDescription?: string;
  className?: string;
}

export function GiftPayChoice({
  mode,
  onChange,
  selfLabel = "I'll pay",
  giftLabel = 'Someone else will pay',
  selfDescription = 'Pay now with mobile money or card',
  giftDescription = 'Send a secure link so a friend or family member can pay',
  className,
}: GiftPayChoiceProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-sm font-semibold tracking-tight">Who is paying?</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange('self')}
          className={cn(
            'group relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition',
            mode === 'self'
              ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
              : 'border-border/80 bg-card hover:border-primary/35'
          )}
        >
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              mode === 'self' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <Smartphone className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold">{selfLabel}</span>
          <span className="text-xs leading-relaxed text-muted-foreground">{selfDescription}</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('gift')}
          className={cn(
            'group relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition',
            mode === 'gift'
              ? 'border-accent bg-accent/10 shadow-sm shadow-accent/10'
              : 'border-border/80 bg-card hover:border-accent/40'
          )}
        >
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              mode === 'gift' ? 'bg-accent/25 text-accent-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            <Gift className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold">{giftLabel}</span>
          <span className="text-xs leading-relaxed text-muted-foreground">{giftDescription}</span>
        </button>
      </div>
    </div>
  );
}
