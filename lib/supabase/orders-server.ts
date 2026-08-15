import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import type { Order, OrderItem, ShippingAddress } from '@/lib/types/database';

export type CreateServerOrderInput = {
  id: string;
  userId: string | null;
  customerName: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: ShippingAddress;
  orderType: Order['orderType'];
  paymentMethod: Order['paymentMethod'];
  paymentStatus: Order['paymentStatus'];
  paytotaPurchaseId?: string;
  paytotaReference?: string;
  cardTransToken?: string;
  cardTransRef?: string;
  supplierIds?: string[];
};

export type PaymentUpdateInput = {
  paymentStatus?: Order['paymentStatus'];
  paymentMethod?: Order['paymentMethod'];
  paytotaPurchaseId?: string;
  paytotaReference?: string;
  cardTransToken?: string;
  cardTransRef?: string;
  status?: Order['status'];
};

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    customerName: String(row.customer_name ?? ''),
    email: String(row.email ?? ''),
    items: Array.isArray(row.items) ? (row.items as Order['items']) : [],
    subtotal: Number(row.subtotal ?? 0),
    tax: Number(row.tax ?? 0),
    total: Number(row.total ?? 0),
    shippingAddress: (row.shipping_address as ShippingAddress) ?? ({} as ShippingAddress),
    status: (row.status as Order['status']) ?? 'pending',
    orderType: (row.order_type as Order['orderType']) ?? 'retail',
    paymentMethod: row.payment_method as Order['paymentMethod'],
    paymentStatus: row.payment_status as Order['paymentStatus'],
    paytotaPurchaseId: row.paytota_purchase_id ? String(row.paytota_purchase_id) : undefined,
    paytotaReference: row.paytota_reference ? String(row.paytota_reference) : undefined,
    cardTransToken: row.card_trans_token ? String(row.card_trans_token) : undefined,
    cardTransRef: row.card_trans_ref ? String(row.card_trans_ref) : undefined,
    supplierIds: Array.isArray(row.supplier_ids)
      ? (row.supplier_ids as unknown[]).map(String)
      : undefined,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function createOrderInputToRow(order: CreateServerOrderInput): Record<string, unknown> {
  const { id, userId, customerName, email, items, subtotal, tax, total, shippingAddress, orderType, paymentMethod, paymentStatus, paytotaPurchaseId, paytotaReference, cardTransToken, cardTransRef, supplierIds } = order;

  return stripUndefined({
    id,
    user_id: userId,
    customer_name: customerName,
    email,
    items,
    subtotal,
    tax,
    total,
    shipping_address: shippingAddress,
    status: 'pending',
    order_type: orderType,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    paytota_purchase_id: paytotaPurchaseId,
    paytota_reference: paytotaReference,
    card_trans_token: cardTransToken,
    card_trans_ref: cardTransRef,
    supplier_ids: supplierIds,
  });
}

function paymentUpdateToRow(updates: PaymentUpdateInput): Record<string, unknown> {
  return stripUndefined({
    payment_status: updates.paymentStatus,
    payment_method: updates.paymentMethod,
    paytota_purchase_id: updates.paytotaPurchaseId,
    paytota_reference: updates.paytotaReference,
    card_trans_token: updates.cardTransToken,
    card_trans_ref: updates.cardTransRef,
    status: updates.status,
    updated_at: new Date().toISOString(),
  });
}

export async function createOrderServer(order: CreateServerOrderInput): Promise<string> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Server order creation requires SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = getSupabaseAdmin();
  const { id } = order;

  const { error } = await supabase.from(TABLES.orders).insert(createOrderInputToRow(order));
  if (error) throw error;

  void import('@/lib/fcm/partner-alerts-server').then(({ notifyPartnerOrder }) =>
    notifyPartnerOrder(id)
  );

  return id;
}

export async function getOrderServer(id: string): Promise<Order | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from(TABLES.orders).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapOrder(data as Record<string, unknown>);
}

export async function getOrderByPaytotaReference(reference: string): Promise<Order | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = getSupabaseAdmin();

  const { data: byRef, error: refError } = await supabase
    .from(TABLES.orders)
    .select('*')
    .eq('paytota_reference', reference)
    .limit(1)
    .maybeSingle();

  if (refError) throw refError;
  if (byRef) return mapOrder(byRef as Record<string, unknown>);

  const { data: byId, error: idError } = await supabase
    .from(TABLES.orders)
    .select('*')
    .eq('id', reference)
    .maybeSingle();

  if (idError) throw idError;
  if (!byId) return null;
  return mapOrder(byId as Record<string, unknown>);
}

export async function getOrderByCardTransToken(transToken: string): Promise<Order | null> {
  if (!isSupabaseAdminConfigured() || !transToken) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select('*')
    .eq('card_trans_token', transToken)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapOrder(data as Record<string, unknown>);
}

export async function getOrderByCardTransRef(transRef: string): Promise<Order | null> {
  if (!isSupabaseAdminConfigured() || !transRef) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select('*')
    .eq('card_trans_ref', transRef)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapOrder(data as Record<string, unknown>);
}

export async function updateOrderPaymentServer(
  orderId: string,
  updates: PaymentUpdateInput
): Promise<void> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Server order updates require SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from(TABLES.orders)
    .update(paymentUpdateToRow(updates))
    .eq('id', orderId);

  if (error) throw error;
}
