'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Gift, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

export type PaymentLiveKind = 'paid' | 'waiting' | 'failed' | 'expired';

const KIND = {
  paid: {
    icon: CheckCircle2,
    label: 'Paid',
    ring: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/20',
    glow: 'from-emerald-500/20 via-card to-card',
    bar: 'from-emerald-500 via-emerald-400 to-accent',
  },
  waiting: {
    icon: Clock,
    label: 'Waiting',
    ring: 'bg-amber-500/15 text-amber-800 ring-amber-500/25',
    glow: 'from-amber-500/20 via-card to-card',
    bar: 'from-amber-500 via-primary to-accent',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    ring: 'bg-red-500/15 text-red-700 ring-red-500/20',
    glow: 'from-red-500/15 via-card to-card',
    bar: 'from-red-500 via-red-400 to-primary',
  },
  expired: {
    icon: XCircle,
    label: 'Expired',
    ring: 'bg-muted text-muted-foreground ring-border',
    glow: 'from-muted/80 via-card to-card',
    bar: 'from-muted-foreground/40 via-border to-border',
  },
} as const;

export function PaymentStatusPanel({
  kind,
  title,
  detail,
  amount,
  reference,
  gift = false,
  live = false,
  steps,
  actions,
}: {
  kind: PaymentLiveKind;
  title: string;
  detail?: string;
  amount?: number;
  reference?: string | null;
  gift?: boolean;
  live?: boolean;
  steps?: { label: string; state: 'done' | 'current' | 'todo' }[];
  actions?: ReactNode;
}) {
  const config = KIND[kind];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-white/70 bg-card/95 shadow-[0_28px_80px_-28px_oklch(0.28_0.08_340_/_0.45)] ring-1 ring-black/[0.04]',
        'bg-gradient-to-br',
        config.glow
      )}
    >
      <div aria-hidden className={cn('h-1 w-full bg-gradient-to-r', config.bar)} />
      <div className="px-6 py-8 text-center sm:px-8">
        <span
          className={cn(
            'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ring-1',
            config.ring,
            live && kind === 'waiting' && 'animate-pulse'
          )}
        >
          <Icon className="h-8 w-8" strokeWidth={1.75} />
        </span>
        {gift ? (
          <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
            <Gift className="h-3.5 w-3.5" />
            Gift
          </p>
        ) : null}
        <h1 className="font-[family-name:var(--font-brand)] text-[1.85rem] font-medium tracking-tight sm:text-[2.15rem]">
          {title}
        </h1>
        {detail ? (
          <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">{detail}</p>
        ) : null}

        {typeof amount === 'number' ? (
          <p className="mt-5 text-3xl font-semibold tabular-nums tracking-tight text-primary">
            {formatUGX(amount)}
          </p>
        ) : null}

        {reference ? (
          <p className="mt-2 font-mono text-sm text-muted-foreground">{reference}</p>
        ) : null}

        {steps && steps.length > 0 ? (
          <ol className="mx-auto mt-8 flex max-w-sm items-start justify-between gap-2">
            {steps.map((step, index) => (
              <li key={step.label} className="flex flex-1 flex-col items-center">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-2',
                    step.state === 'done' && 'bg-emerald-600 text-white ring-emerald-600/30',
                    step.state === 'current' &&
                      'bg-amber-500 text-white ring-amber-500/30 animate-pulse',
                    step.state === 'todo' && 'bg-muted text-muted-foreground ring-border'
                  )}
                >
                  {step.state === 'done' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    'mt-2 text-[11px] font-semibold uppercase tracking-wider',
                    step.state === 'todo' ? 'text-muted-foreground' : 'text-foreground'
                  )}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        {actions ? <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">{actions}</div> : null}
      </div>
    </div>
  );
}

export function PaymentStatusActions({
  primaryHref,
  primaryLabel,
  secondaryHref = '/shop',
  secondaryLabel = 'Shop',
}: {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <>
      <Link href={primaryHref}>
        <Button size="lg" className="h-12 min-w-[9rem] rounded-xl">
          {primaryLabel}
        </Button>
      </Link>
      <Link href={secondaryHref}>
        <Button size="lg" variant="outline" className="h-12 min-w-[9rem] rounded-xl">
          {secondaryLabel}
        </Button>
      </Link>
    </>
  );
}
