// Wholesale and bulk ordering types

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
}

export interface PackageRule {
  type: 'fixed' | 'customizable' | 'mix-and-match';
  itemLimit?: number; // for mix-and-match
  requireAll?: boolean; // must include all items
}

export interface Package {
  id: string;
  name: string;
  description: string;
  items: PackageItem[];
  rule: PackageRule;
  basePrice: number;
  discountedPrice: number;
  savingsPercentage: number;
  image?: string;
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
