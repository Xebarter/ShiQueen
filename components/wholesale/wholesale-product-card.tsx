'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ShoppingCart } from 'lucide-react';
import { Product } from '@/lib/types/database';
import { ProductImage } from '@/components/product-image';
import { Button } from '@/components/ui/button';
import { BulkQuantityStepper } from '@/components/wholesale/bulk-quantity-stepper';
import {
  getStockStatus,
  getWholesaleDiscountPercent,
  getWholesaleUnitPrice,
} from '@/lib/wholesale-catalog';
import { formatUGX } from '@/lib/wholesale-data';
import { CartItem } from '@/lib/cart-context';
import { ShareProductButton } from '@/components/shared/share-button';
import { cn } from '@/lib/utils';

type WholesaleProductCardProps = {
  product: Product;
  cartItem?: CartItem;
  onAdd: (product: Product, quantity: number) => void;
};

function StockBadge({ product }: { product: Product }) {
  const status = getStockStatus(product);

  if (status === 'out-of-stock') {
    return <span className="text-[11px] font-medium text-red-700">Out of stock</span>;
  }

  if (status === 'low-stock') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        Low · {product.stock}
      </span>
    );
  }

  return (
    <span className="text-[11px] font-medium text-emerald-700">
      In stock · {product.stock}
    </span>
  );
}

export function WholesaleProductCard({ product, cartItem, onAdd }: WholesaleProductCardProps) {
  const outOfStock = getStockStatus(product) === 'out-of-stock';
  const minQty = product.minOrderQuantity;
  const maxQty = useMemo(() => {
    const caps = [product.stock];
    if (product.maxOrderQuantity) caps.push(product.maxOrderQuantity);
    return Math.max(minQty, Math.min(...caps));
  }, [product.stock, product.maxOrderQuantity, minQty]);

  const [quantity, setQuantity] = useState(minQty);

  useEffect(() => {
    setQuantity((q) => Math.min(maxQty, Math.max(minQty, q)));
  }, [minQty, maxQty]);

  const unitPrice = getWholesaleUnitPrice(product, quantity);
  const discountPercent = getWholesaleDiscountPercent(product.price, quantity);
  const lineTotal = unitPrice * quantity;
  const savingsPerUnit = product.price - unitPrice;
  const inCart = Boolean(cartItem);

  const handleAdd = () => {
    if (outOfStock || quantity < minQty || quantity > product.stock) return;
    onAdd(product, quantity);
  };

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-colors',
        !outOfStock && 'hover:border-border',
        outOfStock && 'opacity-70'
      )}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-muted/40">
        <ProductImage
          product={product}
          className="h-full w-full"
          imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            {discountPercent > 0 ? (
              <span className="rounded bg-foreground/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
                −{discountPercent}%
              </span>
            ) : null}
            {inCart ? (
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                In cart
              </span>
            ) : null}
          </div>
          <ShareProductButton product={product} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {product.category}
          </p>
          <StockBadge product={product} />
        </div>

        <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight">
          {product.name}
        </h3>

        <div className="mt-3 flex items-end justify-between gap-3 border-t border-border/50 pt-3">
          <div>
            <p className="text-[11px] text-muted-foreground line-through">
              {formatUGX(product.price)} retail
            </p>
            <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatUGX(unitPrice)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">/ unit</span>
            </p>
            {savingsPerUnit > 0 ? (
              <p className="mt-0.5 text-[11px] font-medium text-primary">
                Save {formatUGX(savingsPerUnit)} / unit
              </p>
            ) : null}
          </div>
          <p className="rounded-md bg-muted/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            MOQ {minQty}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <BulkQuantityStepper
            quantity={quantity}
            min={minQty}
            max={maxQty}
            disabled={outOfStock}
            onChange={setQuantity}
          />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Line</p>
            <p className="text-sm font-semibold tabular-nums">{formatUGX(lineTotal)}</p>
          </div>
        </div>

        <Button
          className="mt-4 h-11 w-full gap-2 rounded-lg text-sm font-semibold"
          disabled={outOfStock || quantity < minQty}
          onClick={handleAdd}
        >
          <ShoppingCart className="h-4 w-4" />
          {inCart ? 'Add more' : 'Add to order'}
        </Button>

        {cartItem ? (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {cartItem.quantity} units in order
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function WholesaleProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="aspect-[5/4] animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
