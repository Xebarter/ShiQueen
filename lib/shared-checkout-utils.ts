import { randomBytes } from 'crypto';
import type { CartItem } from '@/lib/cart-context';
import type { SharedCheckout, SharedCheckoutPublicView } from '@/lib/types/shared-checkout';
import type { ShippingAddress } from '@/lib/types/database';

const SHARE_CHECKOUT_TTL_MS = 48 * 60 * 60 * 1000;

export function generateShareCheckoutToken(): string {
  return randomBytes(16).toString('base64url');
}

export function getShareCheckoutExpiryDate(from = new Date()): Date {
  return new Date(from.getTime() + SHARE_CHECKOUT_TTL_MS);
}

export function resolveSharedCheckoutStatus(
  checkout: SharedCheckout,
  now = new Date()
): SharedCheckout['status'] {
  if (checkout.status === 'paid') return 'paid';
  if (checkout.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'pending';
}

export function getRecipientFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return 'your friend';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function buildShippingAddressFromForm(form: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}): ShippingAddress {
  const trimmed = form.fullName.trim();
  const space = trimmed.indexOf(' ');
  const firstName = space === -1 ? trimmed : trimmed.slice(0, space);
  const lastName = space === -1 ? '' : trimmed.slice(space + 1).trim();

  return {
    firstName,
    lastName,
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    city: form.city.trim() || 'Kampala',
    state: '',
    zipCode: '',
    country: 'Uganda',
  };
}

export function inferOrderTypeFromCart(cartItems: CartItem[]): SharedCheckout['orderType'] {
  const isPackageOrder = cartItems.some((item) => item.id.startsWith('pkg-'));
  const isWholesaleOrder = cartItems.some((item) => item.quantity >= 10);
  if (isPackageOrder) return 'package';
  if (isWholesaleOrder) return 'wholesale';
  return 'retail';
}

export function toSharedCheckoutPublicView(checkout: SharedCheckout): SharedCheckoutPublicView {
  const status = resolveSharedCheckoutStatus(checkout);

  return {
    token: checkout.id,
    status,
    recipientFirstName: getRecipientFirstName(checkout.recipientName),
    deliveryCity: checkout.shippingAddress.city || 'Kampala',
    items: checkout.cartItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      image: item.image || undefined,
      lineTotal: item.price * item.quantity,
    })),
    subtotal: checkout.subtotal,
    total: checkout.total,
    senderMessage: checkout.senderMessage,
    orderId: checkout.orderId,
    expiresAt: checkout.expiresAt.toISOString(),
  };
}
