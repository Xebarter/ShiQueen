'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Package, ShoppingCart, Tag } from 'lucide-react';
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
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-inset ring-red-500/20">
        Out of stock
      </span>
    );
  }

  if (status === 'low-stock') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-500/20">
        <AlertTriangle className="h-3 w-3" />
        Low stock · {product.stock} left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
      In stock · {product.stock} units
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
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm shadow-primary/5 transition-all duration-300',
        !outOfStock && 'hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md hover:shadow-primary/10',
        outOfStock && 'opacity-80'
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <ProductImage
          product={product}
          className="h-full w-full"
          imageClassName="transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {discountPercent > 0 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground shadow-sm">
            <Tag className="h-3 w-3" />
            Save {discountPercent}%
          </span>
        )}
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <ShareProductButton product={product} />
          {inCart && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
              In cart
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {product.category}
          </span>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            MOQ {minQty}
          </span>
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight sm:text-lg">
          {product.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>

        <div className="mt-3">
          <StockBadge product={product} />
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-sm text-muted-foreground line-through">{formatUGX(product.price)}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-primary">{formatUGX(unitPrice)}</p>
            <span className="text-xs font-medium text-muted-foreground">/ unit wholesale</span>
          </div>
          {savingsPerUnit > 0 && (
            <p className="text-xs font-medium text-accent">
              You save {formatUGX(savingsPerUnit)} per unit at this quantity
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <BulkQuantityStepper
            quantity={quantity}
            min={minQty}
            max={maxQty}
            disabled={outOfStock}
            onChange={setQuantity}
          />
          <p className="text-right text-sm font-semibold sm:min-w-[100px]">
            <span className="text-muted-foreground">Line total </span>
            <br className="sm:hidden" />
            {formatUGX(lineTotal)}
          </p>
        </div>

        <Button
          className="mt-4 h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-md shadow-primary/15"
          disabled={outOfStock || quantity < minQty}
          onClick={handleAdd}
        >
          <ShoppingCart className="h-4 w-4" />
          {inCart ? 'Add more to bulk cart' : 'Add to bulk cart'}
        </Button>

        {cartItem && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            <Package className="mr-1 inline h-3 w-3" />
            {cartItem.quantity} units in your bulk cart
          </p>
        )}
      </div>
    </article>
  );
}

export function WholesaleProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
