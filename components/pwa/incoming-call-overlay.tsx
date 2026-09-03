import { Phone, PhoneOff, ShoppingBag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type IncomingAlert = {
  id: string;
  kind: 'order' | 'booking';
  title: string;
  body: string;
  href: string;
};

export function IncomingCallOverlay({
  incoming,
  onAccept,
  onDecline,
}: {
  incoming: IncomingAlert;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const Icon = incoming.kind === 'order' ? ShoppingBag : Sparkles;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <div
        className="pointer-events-none absolute inset-0 bg-background/55 backdrop-blur-[2px]"
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-labelledby="incoming-alert-title"
        aria-describedby="incoming-alert-body"
        className={cn(
          'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-[1.75rem]',
          'border border-border/70 bg-card shadow-[0_24px_80px_oklch(0.35_0.08_340_/_28%)]'
        )}
      >
        <div className="bg-gradient-to-b from-primary/[0.12] via-card to-card px-5 pb-5 pt-6 text-center">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />
            <span className="absolute inset-1 animate-pulse rounded-full bg-primary/15" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Icon className="h-6 w-6" />
            </span>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {incoming.kind === 'order' ? 'New order' : 'New booking'}
          </p>
          <h2 id="incoming-alert-title" className="mt-1 text-xl font-bold tracking-tight">
            {incoming.title}
          </h2>
          <p id="incoming-alert-body" className="mt-1 text-sm text-muted-foreground">
            {incoming.body}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border/60 bg-muted/20 p-4">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-full border-rose-200 bg-background text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            onClick={onDecline}
          >
            <PhoneOff className="h-4 w-4" />
            Decline
          </Button>
          <Button type="button" className="h-12 rounded-full" onClick={onAccept}>
            <Phone className="h-4 w-4" />
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
