'use client';

import Link from 'next/link';
import { Check, Copy, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

interface GiftPayLinkPanelProps {
  amountLabel: string;
  total: number;
  recipientName: string;
  shareUrl: string | null;
  expiresAt: string | null;
  loading: boolean;
  canShare: boolean;
  onShareLink: () => void;
  onCopyLink: () => void;
  shareLabel?: string;
  helperText?: string;
  className?: string;
  payLive?: 'pending' | 'paid' | 'expired';
  viewHref?: string | null;
  viewLabel?: string;
}

export function GiftPayLinkPanel({
  amountLabel,
  total,
  recipientName,
  shareUrl,
  expiresAt,
  loading,
  canShare,
  onShareLink,
  onCopyLink,
  shareLabel = 'Share payment link',
  helperText,
  className,
  payLive = 'pending',
  viewHref,
  viewLabel = 'View order',
}: GiftPayLinkPanelProps) {
  const paid = payLive === 'paid';
  const expired = payLive === 'expired';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/[0.1] via-card to-card',
        className
      )}
    >
      <div className="space-y-4 p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-foreground/70">
            Someone else pays
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">
            Share a link for {formatUGX(total)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {amountLabel} for <span className="font-medium text-foreground">{recipientName}</span>
          </p>
        </div>

        {helperText && !shareUrl ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}

        <Button
          type="button"
          id="share-gift-payment-link"
          className="h-12 w-full gap-2 rounded-xl text-base font-semibold"
          disabled={!canShare || loading}
          onClick={onShareLink}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Share2 className="h-5 w-5" />
          )}
          {shareUrl ? 'Share again' : shareLabel}
        </Button>

        {shareUrl ? (
          <div className="space-y-3 rounded-xl border border-border/70 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
              </span>
              Link ready
            </div>
            {expiresAt && !paid ? (
              <p className="text-xs text-muted-foreground">
                Valid until {new Date(expiresAt).toLocaleString()}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full gap-2 rounded-xl"
              onClick={onCopyLink}
            >
              <Copy className="h-4 w-4" />
              Copy link
            </Button>

            <div
              className={cn(
                'rounded-xl px-3 py-3 text-center',
                paid && 'bg-emerald-500/12 ring-1 ring-emerald-500/20',
                expired && 'bg-muted ring-1 ring-border',
                !paid && !expired && 'bg-amber-500/12 ring-1 ring-amber-500/20'
              )}
            >
              <p
                className={cn(
                  'text-sm font-semibold',
                  paid && 'text-emerald-800',
                  expired && 'text-muted-foreground',
                  !paid && !expired && 'text-amber-900'
                )}
              >
                <span
                  className={cn(
                    'mr-2 inline-block h-2 w-2 rounded-full',
                    paid && 'bg-emerald-600',
                    expired && 'bg-muted-foreground',
                    !paid && !expired && 'animate-pulse bg-amber-500'
                  )}
                />
                {paid ? 'Paid' : expired ? 'Expired' : 'Waiting'}
              </p>
              <p
                className={cn(
                  'mt-1 text-xs',
                  paid && 'text-emerald-800/80',
                  expired && 'text-muted-foreground',
                  !paid && !expired && 'text-amber-900/80'
                )}
              >
                {paid ? 'Gift received.' : expired ? 'Ask them for a new link.' : 'Not paid yet.'}
              </p>
              {paid && viewHref ? (
                <Link href={viewHref} className="mt-3 block">
                  <Button className="h-10 w-full rounded-xl">{viewLabel}</Button>
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
