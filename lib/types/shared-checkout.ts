import type { CartItem } from '@/lib/cart-context';
import type { OrderItem, ShippingAddress } from '@/lib/types/database';

export type SharedCheckoutStatus = 'pending' | 'paid' | 'expired';

export interface SharedCheckout {
  id: string;
  status: SharedCheckoutStatus;
  cartItems: CartItem[];
  orderItems: OrderItem[];
  subtotal: number;
  total: number;
  orderType: 'retail' | 'wholesale' | 'package';
  recipientName: string;
  shippingAddress: ShippingAddress;
  senderUserId?: string | null;
  senderMessage?: string;
  orderId?: string;
  expiresAt: Date;
  createdAt: Date;
  paidAt?: Date;
}

export interface SharedCheckoutPublicView {
  token: string;
  status: SharedCheckoutStatus;
  recipientFirstName: string;
  deliveryCity: string;
  items: {
    name: string;
    quantity: number;
    image?: string;
    lineTotal: number;
  }[];
  subtotal: number;
  total: number;
  senderMessage?: string;
  orderId?: string;
  expiresAt: string;
}
