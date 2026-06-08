import { Package, BulkOrder, WholesaleAccount } from '@/lib/types/wholesale';

export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  sizes: string[];
  colors: string[];
  details: string[];
  isWholesaleEnabled: boolean;
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  status: 'Active' | 'Low Stock' | 'Out of Stock';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
  packageId?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type PaymentMethod = 'mobile_money' | 'cash_on_delivery';

export type PaymentStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'cod_pending';

export interface Order {
  id: string;
  userId: string | null;
  customerName: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: ShippingAddress;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderType: 'retail' | 'wholesale' | 'package';
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paytotaPurchaseId?: string;
  paytotaReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type { Package, BulkOrder, WholesaleAccount };

export type MarketingAdPlacement = 'home-hero' | 'shop-hero';

export interface MarketingAd {
  id: string;
  placement: MarketingAdPlacement;
  productId: string;
  bannerImage: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  badgeText: string;
  isActive: boolean;
  priority: number;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
