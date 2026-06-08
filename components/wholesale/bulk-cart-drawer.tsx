'use client';

import { useEffect, useRef } from 'react';
import { Loader2, ShoppingCart, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BulkQuantityStepper } from '@/components/wholesale/bulk-quantity-stepper';
import { CartItem } from '@/lib/cart-context';
import { Product } from '@/lib/types/database';
import { getWholesaleDiscountForItem } from '@/lib/wholesale-cart';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

function cartLineKey(item: CartItem): string {
  return [item.id, item.size, item.color, item.wholesale ? 'wholesale' : 'retail']
    .filter(Boolean)
    .join('-');
}

type BulkCartDrawerProps = {
  open: boolean;
  items: CartItem[];
  subtotal: number;
  totalSavings: number;
  totalUnits: number;
  productsById: Map<string, Product>;
  checkoutLoading?: boolean;
  onClose: () => void;
  onContinue: () => void;
  onViewSummary: () => void;
  onCheckout: () => void;
  onUpdateQuantity: (item: CartItem, quantity: number) => void;
  onRemove: (item: CartItem) => void;
};

export function BulkCartDrawer({
  open,
  items,
  subtotal,
  totalSavings,
  totalUnits,
  productsById,
  checkoutLoading,
  onClose,
  onContinue,
  onViewSummary,
  onCheckout,
  onUpdateQuantity,
  onRemove,
}: BulkCartDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close cart"
          className="fixed inset-0 z-[55] cursor-default bg-black/50 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        aria-hidden={!open}
        className={cn(
          'fixed right-0 top-0 z-[60] flex h-dvh w-full max-w-md flex-col border-l border-border/80 bg-card shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <div>
              <h2 id="cart-drawer-title" className="text-lg font-semibold tracking-tight">
                Cart
              </h2>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'} · {totalUnits} units
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Your cart is empty. Add products to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const product = productsById.get(item.id);
                const isWholesale = Boolean(item.wholesale);
                const minQty = isWholesale ? item.wholesale!.minOrderQuantity : 1;
                const maxQty = isWholesale
                  ? Math.min(
                      product?.stock ?? item.wholesale!.stock,
                      item.wholesale!.maxOrderQuantity ?? product?.stock ?? item.wholesale!.stock
                    )
                  : 999;
                const discountPercent = getWholesaleDiscountForItem(item);

                return (
                  <div
                    key={cartLineKey(item)}
                    className="rounded-xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{item.name}</p>
                          {isWholesale && (
                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                              Wholesale
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatUGX(item.price)} / unit
                        </p>
                        {discountPercent > 0 && (
                          <p className="text-xs font-medium text-accent">
                            {discountPercent}% wholesale discount
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item)}
                        aria-label={`Remove ${item.name}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-red-500/10 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <BulkQuantityStepper
                        quantity={item.quantity}
                        min={minQty}
                        max={maxQty}
                        onChange={(qty) => onUpdateQuantity(item, qty)}
                      />
                      <p className="text-sm font-bold tabular-nums">
                        {formatUGX(item.quantity * item.price)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border/60 bg-background px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatUGX(subtotal)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-sm text-accent">
                  <span>Wholesale savings</span>
                  <span className="font-semibold">{formatUGX(totalSavings)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button
                className="h-12 w-full rounded-xl text-base font-semibold"
                disabled={checkoutLoading}
                onClick={onCheckout}
              >
                {checkoutLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Proceed to checkout
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-11 rounded-xl" onClick={onContinue}>
                  Continue shopping
                </Button>
                <Button variant="outline" className="h-11 rounded-xl" onClick={onViewSummary}>
                  View summary
                </Button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
