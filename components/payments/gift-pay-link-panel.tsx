'use client';

import { Check, Copy, Link2, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

interface GiftPayLinkPanelProps {
  amountLabel: string;
  total: number;
  recipientName: string;
  message: string;
  onMessageChange: (value: string) => void;
  shareUrl: string | null;
  expiresAt: string | null;
  loading: boolean;
  canCreate: boolean;
  onCreateLink: () => void;
  onShareLink: () => void;
  onCopyLink: () => void;
  createLabel?: string;
  helperText?: string;
  className?: string;
}

export function GiftPayLinkPanel({
  amountLabel,
  total,
  recipientName,
  message,
  onMessageChange,
  shareUrl,
  expiresAt,
  loading,
  canCreate,
  onCreateLink,
  onShareLink,
  onCopyLink,
  createLabel = 'Create payment link',
  helperText,
  className,
}: GiftPayLinkPanelProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/[0.12] via-card to-card shadow-sm',
        className
      )}
    >
      <div className="border-b border-accent/20 bg-accent/10 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-foreground/80">
          Gift payment
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight">
          Send a link for {formatUGX(total)}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {amountLabel} for <span className="font-medium text-foreground">{recipientName}</span>
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="gift-pay-message" className="text-sm font-medium">
            Optional message to the payer
          </Label>
          <Input
            id="gift-pay-message"
            value={message}
            onChange={(e) => onMessageChange(e.target.value.slice(0, 200))}
            placeholder="e.g. Could you cover this for me?"
            className="h-11 rounded-xl"
            maxLength={200}
            disabled={Boolean(shareUrl)}
          />
        </div>

        {helperText && !shareUrl && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}

        {!shareUrl ? (
          <Button
            type="button"
            className="h-12 w-full gap-2 rounded-xl text-base font-semibold"
            disabled={!canCreate || loading}
            onClick={onCreateLink}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Link2 className="h-5 w-5" />
            )}
            {createLabel}
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-accent/30 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
              </span>
              Payment link ready — share it now
            </div>
            <p className="break-all rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs text-muted-foreground">
              {shareUrl}
            </p>
            {expiresAt && (
              <p className="text-xs text-muted-foreground">
                Valid until {new Date(expiresAt).toLocaleString()}
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" className="h-11 gap-2 rounded-xl" onClick={onShareLink}>
                <Share2 className="h-4 w-4" />
                Share link
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 rounded-xl"
                onClick={onCopyLink}
              >
                <Copy className="h-4 w-4" />
                Copy link
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your booking is held while we wait for payment. Once they pay, it confirms
              automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
