import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate, toIso } from '@/lib/supabase/timestamp';
import { resolveSharedCheckoutStatus } from '@/lib/shared-checkout-utils';
import type { SharedCheckout } from '@/lib/types/shared-checkout';
import type { CartItem } from '@/lib/cart-context';
import type { OrderItem, ShippingAddress } from '@/lib/types/database';

export type CreateSharedCheckoutInput = {
  id: string;
  cartItems: CartItem[];
  orderItems: OrderItem[];
  subtotal: number;
  total: number;
  orderType: SharedCheckout['orderType'];
  recipientName: string;
  shippingAddress: ShippingAddress;
  senderUserId?: string | null;
  senderMessage?: string;
  expiresAt: Date;
};

function mapSharedCheckout(row: Record<string, unknown>): SharedCheckout {
  return {
    id: String(row.id),
    status: (row.status as SharedCheckout['status']) ?? 'pending',
    cartItems: Array.isArray(row.cart_items) ? (row.cart_items as CartItem[]) : [],
    orderItems: Array.isArray(row.order_items) ? (row.order_items as OrderItem[]) : [],
    subtotal: Number(row.subtotal ?? 0),
    total: Number(row.total ?? 0),
    orderType: (row.order_type as SharedCheckout['orderType']) ?? 'retail',
    recipientName: String(row.recipient_name ?? ''),
    shippingAddress: (row.shipping_address as ShippingAddress) ?? ({} as ShippingAddress),
    senderUserId: row.sender_user_id ? String(row.sender_user_id) : null,
    senderMessage: row.sender_message ? String(row.sender_message) : undefined,
    orderId: row.order_id ? String(row.order_id) : undefined,
    expiresAt: toDate(row.expires_at),
    createdAt: toDate(row.created_at),
    paidAt: row.paid_at ? toDate(row.paid_at) : undefined,
  };
}

function createSharedCheckoutInputToRow(input: CreateSharedCheckoutInput): Record<string, unknown> {
  const {
    id,
    cartItems,
    orderItems,
    subtotal,
    total,
    orderType,
    recipientName,
    shippingAddress,
    senderUserId,
    senderMessage,
    expiresAt,
  } = input;

  return stripUndefined({
    id,
    status: 'pending',
    cart_items: cartItems,
    order_items: orderItems,
    subtotal,
    total,
    order_type: orderType,
    recipient_name: recipientName,
    shipping_address: shippingAddress,
    sender_user_id: senderUserId,
    sender_message: senderMessage,
    expires_at: toIso(expiresAt),
  });
}

export async function createSharedCheckout(
  input: CreateSharedCheckoutInput
): Promise<SharedCheckout> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Shared checkout requires SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = getSupabaseAdmin();
  const { id } = input;

  const { error } = await supabase
    .from(TABLES.sharedCheckouts)
    .insert(createSharedCheckoutInputToRow(input));

  if (error) throw error;

  return {
    id,
    status: 'pending',
    cartItems: input.cartItems,
    orderItems: input.orderItems,
    subtotal: input.subtotal,
    total: input.total,
    orderType: input.orderType,
    recipientName: input.recipientName,
    shippingAddress: input.shippingAddress,
    senderUserId: input.senderUserId ?? null,
    senderMessage: input.senderMessage,
    expiresAt: input.expiresAt,
    createdAt: new Date(),
  };
}

export async function getSharedCheckoutById(token: string): Promise<SharedCheckout | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.sharedCheckouts)
    .select('*')
    .eq('id', token)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const checkout = mapSharedCheckout(data as Record<string, unknown>);
  const resolvedStatus = resolveSharedCheckoutStatus(checkout);

  if (resolvedStatus === 'expired' && checkout.status === 'pending') {
    return { ...checkout, status: 'expired' };
  }

  return { ...checkout, status: resolvedStatus };
}

export async function reserveSharedCheckoutForPayment(
  token: string,
  orderId: string
): Promise<'reserved' | 'paid' | 'expired' | 'in_progress' | 'not_found'> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Shared checkout updates require SUPABASE_SERVICE_ROLE_KEY.');
  }

  const checkout = await getSharedCheckoutById(token);
  if (!checkout) return 'not_found';

  const status = resolveSharedCheckoutStatus(checkout);

  if (status === 'paid') return 'paid';
  if (status === 'expired') return 'expired';
  if (checkout.orderId) return 'in_progress';

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.sharedCheckouts)
    .update({ order_id: orderId })
    .eq('id', token)
    .eq('status', 'pending')
    .is('order_id', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) return 'in_progress';

  return 'reserved';
}

export async function markSharedCheckoutPaidByOrderId(orderId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.sharedCheckouts)
    .select('id')
    .eq('order_id', orderId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  await markSharedCheckoutPaid(String(data.id), orderId);
}

export async function markSharedCheckoutPaid(
  token: string,
  orderId: string
): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Shared checkout updates require SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from(TABLES.sharedCheckouts)
    .update({
      status: 'paid',
      order_id: orderId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', token);

  if (error) throw error;
}
