import { Truck } from 'lucide-react';
import { formatUGX } from '@/lib/wholesale-data';
import type { OrderQuote } from '@/lib/commerce-settings';

export function OrderQuoteLines({
  quote,
  wholesaleSavings = 0,
  shippingLabel = 'Delivery',
}: {
  quote: OrderQuote;
  wholesaleSavings?: number;
  shippingLabel?: string;
}) {
  return (
    <>
      <div className="flex justify-between text-muted-foreground">
        <span>Subtotal</span>
        <span className="font-medium text-foreground">{formatUGX(quote.subtotal)}</span>
      </div>
      {wholesaleSavings > 0 ? (
        <div className="flex justify-between text-accent">
          <span>Wholesale savings</span>
          <span className="font-medium">−{formatUGX(wholesaleSavings)}</span>
        </div>
      ) : null}
      <div className="flex justify-between text-muted-foreground">
        <span>{shippingLabel}</span>
        {quote.delivery.free ? (
          <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
            <Truck className="h-3.5 w-3.5" />
            Free
          </span>
        ) : (
          <span className="font-medium tabular-nums text-foreground">
            {formatUGX(quote.shipping)}
          </span>
        )}
      </div>
      {quote.taxQuote.enabled ? (
        <div className="flex justify-between text-muted-foreground">
          <span>{quote.taxQuote.label}</span>
          <span className="font-medium tabular-nums text-foreground">{formatUGX(quote.tax)}</span>
        </div>
      ) : null}
    </>
  );
}
