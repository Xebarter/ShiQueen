'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Boxes, Sparkles } from 'lucide-react';
import { Package } from '@/lib/types/wholesale';
import { Product } from '@/lib/types/database';
import type { ServiceListing } from '@/lib/types/services';
import { formatUGX } from '@/lib/wholesale-data';
import { isRemoteProductImage } from '@/components/product-image';
import {
  getPackageItemImage,
  getPackageItemKind,
  getPackageItemName,
  getPackageItemRefId,
  getPackageItemRetailUnit,
  isCustomPackageItem,
  isServicePackageItem,
} from '@/lib/package-utils';
import { useFeature } from '@/lib/feature-flags-context';

interface PackageContentsListProps {
  pkg: Package;
  productNames: Record<string, string>;
  retailPrices: Record<string, number>;
  products: Product[];
  services?: ServiceListing[];
  showLinks?: boolean;
}

export function PackageContentsList({
  pkg,
  productNames,
  retailPrices,
  products,
  services = [],
  showLinks = true,
}: PackageContentsListProps) {
  const servicesEnabled = useFeature('services');
  return (
    <div className="space-y-3">
      {pkg.items.map((item, index) => {
        const kind = getPackageItemKind(item);
        const isCustom = isCustomPackageItem(item);
        const isService = isServicePackageItem(item);
        const refId = getPackageItemRefId(item);
        const itemName = getPackageItemName(item, productNames);
        const itemImage = getPackageItemImage(item, products, services);
        const lineRetail = getPackageItemRetailUnit(item, retailPrices) * item.quantity;
        const service = isService ? services.find((s) => s.id === refId) : undefined;

        const content = (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-14 sm:w-14">
              {itemImage && isRemoteProductImage(itemImage) ? (
                <Image
                  src={itemImage}
                  alt={itemName}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  {isService ? <Sparkles className="h-5 w-5" /> : <Boxes className="h-5 w-5" />}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug sm:text-base">{itemName}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {kind === 'service' ? 'Service' : kind === 'custom' ? 'Custom' : 'Product'} · Qty:{' '}
                {item.quantity}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums sm:text-base">
              {formatUGX(lineRetail)}
            </p>
          </div>
        );

        const href =
          showLinks && !isCustom
            ? isService && service?.slug && servicesEnabled
              ? `/services/${service.slug}`
              : !isService && products.some((p) => p.id === item.productId)
                ? `/products/${item.productId}`
                : null
            : null;

        return (
          <div
            key={index}
            className="border-b border-border pb-3 last:border-b-0 last:pb-0"
          >
            {href ? (
              <Link href={href} className="block transition hover:opacity-80">
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
