import { Package, BulkOrder, WholesaleAccount } from '@/lib/types/wholesale';

export type UserRole = 'customer' | 'admin' | 'supplier' | 'service_provider';

export interface UserNotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  serviceReminders: boolean;
  smsAlerts: boolean;
  pushAlerts: boolean;
}

export interface UserSavedAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district?: string;
  notes?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  supplierId?: string;
  providerId?: string;
  preferences?: UserNotificationPreferences;
  defaultAddress?: UserSavedAddress;
  fcmTokens?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  supplierId: string;
  price: number;
  originalPrice?: number;
  wholesalePrice?: number;
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
  /** Distinguishes catalog products vs service listings inside expanded packages. */
  itemType?: 'product' | 'service' | 'custom';
  serviceId?: string;
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

export type PaymentMethod = 'mobile_money' | 'card' | 'cash_on_delivery';

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
  cardTransToken?: string;
  cardTransRef?: string;
  supplierIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type { Package, BulkOrder, WholesaleAccount };

export type ProductReviewFlagReason =
  | 'inappropriate'
  | 'spam'
  | 'fake'
  | 'off_topic'
  | 'other';

export type ProductReviewFlagStatus = 'none' | 'pending' | 'dismissed';

export const PRODUCT_REVIEW_FLAG_REASONS: Array<{
  value: ProductReviewFlagReason;
  label: string;
  description: string;
}> = [
  {
    value: 'inappropriate',
    label: 'Inappropriate',
    description: 'Offensive, abusive, or unsuitable language',
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Promotional or irrelevant content',
  },
  {
    value: 'fake',
    label: 'Suspicious / fake',
    description: 'Does not seem like a real customer experience',
  },
  {
    value: 'off_topic',
    label: 'Off-topic',
    description: 'Not about this product',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Something else that needs admin attention',
  },
];

export type ProductReview = {
  id: string;
  productId: string;
  orderId?: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  customerName: string;
  isVerified: boolean;
  isVisible: boolean;
  isFlagged: boolean;
  flagStatus: ProductReviewFlagStatus;
  flagReason: string;
  flagNote: string;
  flaggedBy?: string;
  flaggedAt?: Date;
  flagResolvedAt?: Date;
  flagResolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

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
