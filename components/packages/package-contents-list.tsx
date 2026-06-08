'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import { formatUGX } from '@/lib/wholesale-data';
import { isRemoteProductImage } from '@/components/product-image';

interface PackageContentsListProps {
  pkg: Package;
  productNames: Record<string, string>;
  retailPrices: Record<string, number>;
  products: Product[];
  showLinks?: boolean;
}

export function PackageContentsList({
  pkg,
  productNames,
  retailPrices,
  products,
  showLinks = true,
}: PackageContentsListProps) {
  return (
    <div className="space-y-3">
      {pkg.items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        const lineRetail = (retailPrices[item.productId] || 0) * item.quantity;

        const content = (
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              {product && isRemoteProductImage(product.image) ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">📦</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{productNames[item.productId] ?? 'Product'}</p>
              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
            </div>
            <p className="shrink-0 font-semibold tabular-nums">{formatUGX(lineRetail)}</p>
          </div>
        );

        return (
          <div
            key={item.productId}
            className="border-b border-border pb-3 last:border-b-0 last:pb-0"
          >
            {showLinks && product ? (
              <Link href={`/products/${product.id}`} className="block hover:opacity-80 transition">
                {content}
              </Link>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}
