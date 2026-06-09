// Wholesale and bulk ordering types

import type { PackageCategoryId, PackageTierId } from '@/lib/package-catalog';

export type { PackageCategoryId, PackageTierId };

export interface PricingTier {
  minQuantity: number;
  maxQuantity: number | null; // null means unlimited
  pricePerUnit: number;
  discount: number; // percentage discount from retail
}

export interface WholesaleProduct {
  productId: string;
  isWholesaleEnabled: boolean;
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  pricingTiers: PricingTier[];
  wholesaleDescription?: string;
  leadTime?: number; // days
}

export interface PackageItem {
  productId: string;
  quantity: number;
  price?: number; // optional override
  /** Package-only line — not in the product catalog */
  isCustom?: boolean;
  customName?: string;
  customImage?: string;
  customRetailPrice?: number;
}

export interface PackageRule {
  type: 'fixed' | 'customizable' | 'mix-and-match';
  itemLimit?: number; // for mix-and-match
  requireAll?: boolean; // must include all items
}

export type PackagePricingMode = 'auto' | 'custom';
export type PackageCoverMode = 'upload' | 'products';

export interface Package {
  id: string;
  name: string;
  description: string;
  items: PackageItem[];
  rule: PackageRule;
  pricingMode: PackagePricingMode;
  basePrice: number;
  discountedPrice: number;
  savingsPercentage: number;
  coverMode?: PackageCoverMode;
  image?: string;
  coverProductIds?: string[];
  category?: PackageCategoryId;
  tagline?: string;
  highlights?: string[];
  tier?: PackageTierId;
  isSignature?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkOrder {
  id: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  orderType: 'retail' | 'wholesale' | 'package';
  status: 'draft' | 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  requestedAt: Date;
  approvedAt?: Date;
  shippedAt?: Date;
}

export interface WholesaleAccount {
  id: string;
  customerId: string;
  companyName: string;
  taxId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  discount?: number; // account-level discount
  creditLimit?: number;
  createdAt: Date;
  approvedAt?: Date;
}
