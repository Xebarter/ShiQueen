import { resolveOrderSuppliers } from '@/lib/orders/resolve-suppliers';
import { getSupabaseClient } from '@/lib/supabase/client';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import { Order, OrderItem, ShippingAddress } from '@/lib/types/database';

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    customerName: String(row.customer_name ?? ''),
    email: String(row.email ?? ''),
    items: Array.isArray(row.items) ? (row.items as OrderItem[]) : [],
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
    giftPayment: row.gift_payment === true,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function orderToRow(data: Partial<Order> & { id?: string }): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    user_id: data.userId,
    customer_name: data.customerName,
    email: data.email,
    items: data.items,
    subtotal: data.subtotal,
    tax: data.tax,
    total: data.total,
    shipping_address: data.shippingAddress,
    status: data.status,
    order_type: data.orderType,
    payment_method: data.paymentMethod,
    payment_status: data.paymentStatus,
    paytota_purchase_id: data.paytotaPurchaseId,
    paytota_reference: data.paytotaReference,
    card_trans_token: data.cardTransToken,
    card_trans_ref: data.cardTransRef,
    supplier_ids: data.supplierIds,
    gift_payment: data.giftPayment,
  });
}

async function collectSupplierAttribution(
  items: OrderItem[]
): Promise<{ items: OrderItem[]; supplierIds: string[] }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const supplierIds = [
      ...new Set(items.map((item) => item.supplierId).filter((id): id is string => Boolean(id))),
    ];
    return { items, supplierIds };
  }
  return resolveOrderSuppliers(supabase, items);
}

async function fetchOrders(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
}

async function fetchUserOrders(userId: string): Promise<Order[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from(TABLES.orders).select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? [])
    .map((row) => mapOrder(row as Record<string, unknown>))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

async function fetchOrdersForSupplier(supplierId: string): Promise<Order[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !supplierId) return [];
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select('*')
    .contains('supplier_ids', [supplierId]);
  if (error) throw error;
  return (data ?? [])
    .map((row) => mapOrder(row as Record<string, unknown>))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createOrder(order: Omit<Order, 'createdAt' | 'updatedAt'>): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { id, ...data } = order;
  const attributed = await collectSupplierAttribution(data.items);
  const supplierIds =
    data.supplierIds && data.supplierIds.length > 0 ? data.supplierIds : attributed.supplierIds;

  const { error } = await supabase.from(TABLES.orders).insert(
    orderToRow({
      ...data,
      id,
      items: attributed.items,
      supplierIds,
      status: data.status ?? 'pending',
    })
  );
  if (error) throw error;

  void import('@/lib/pwa/notify-client').then(({ notifyPartnerClients, notifyAdminOrderClients }) => {
    void notifyPartnerClients('order', id);
    void notifyAdminOrderClients(id);
  });

  return id;
}

export async function getOrder(id: string): Promise<Order | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLES.orders).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapOrder(data as Record<string, unknown>);
}

export async function getOrders(): Promise<Order[]> {
  return fetchOrders();
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  return fetchUserOrders(userId);
}

export function subscribeOrders(
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.orders, fetchOrders, onData, onError);
}

export function subscribeUserOrders(
  userId: string,
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(
    `${TABLES.orders}:user:${userId}`,
    () => fetchUserOrders(userId),
    onData,
    onError
  );
}

export function subscribeOrdersForSupplier(
  supplierId: string,
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(
    `${TABLES.orders}:supplier:${supplierId}`,
    () => fetchOrdersForSupplier(supplierId),
    onData,
    onError
  );
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');
  const { error } = await supabase.from(TABLES.orders).update({ status }).eq('id', id);
  if (error) throw error;
}

export function subscribeOrder(
  id: string,
  onData: (order: Order | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const supabase = getSupabaseClient();
  if (!supabase) {
    onData(null);
    return () => {};
  }

  const refresh = () => {
    void getOrder(id)
      .then(onData)
      .catch((error) => onError?.(error as Error));
  };

  refresh();

  const channel = supabase
    .channel(`order:${id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLES.orders, filter: `id=eq.${id}` },
      refresh
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export { generateOrderId } from '@/lib/order-utils';
