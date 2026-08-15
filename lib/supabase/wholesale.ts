import { getSupabaseClient } from '@/lib/supabase/client';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate, toIso } from '@/lib/supabase/timestamp';
import { isValidPackageCategory } from '@/lib/package-catalog';
import { Package, BulkOrder, WholesaleAccount } from '@/lib/types/wholesale';
import { DEFAULT_SUPPLIER_ID } from '@/lib/types/suppliers';

function mapPackage(row: Record<string, unknown>): Package {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    supplierId: String(row.supplier_id ?? DEFAULT_SUPPLIER_ID),
    items: Array.isArray(row.items) ? row.items : [],
    rule: row.rule as Package['rule'],
    pricingMode: row.pricing_mode === 'auto' ? 'auto' : 'custom',
    basePrice: Number(row.base_price ?? 0),
    discountedPrice: Number(row.discounted_price ?? 0),
    savingsPercentage: Number(row.savings_percentage ?? 0),
    coverMode:
      row.cover_mode === 'products'
        ? 'products'
        : row.cover_mode === 'upload'
          ? 'upload'
          : undefined,
    image: row.image ? String(row.image) : undefined,
    coverProductIds: Array.isArray(row.cover_product_ids)
      ? row.cover_product_ids.map(String).slice(0, 4)
      : undefined,
    category:
      typeof row.category === 'string' && isValidPackageCategory(row.category)
        ? row.category
        : undefined,
    tagline: row.tagline ? String(row.tagline) : undefined,
    highlights: Array.isArray(row.highlights)
      ? row.highlights.map(String).slice(0, 5)
      : undefined,
    tier:
      typeof row.tier === 'string' &&
      ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'vip'].includes(row.tier)
        ? (row.tier as Package['tier'])
        : undefined,
    isSignature: row.is_signature === true ? true : undefined,
    isActive: Boolean(row.is_active ?? true),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function packageToRow(data: Partial<Package> & { id?: string }): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    name: data.name,
    description: data.description,
    supplier_id: data.supplierId,
    items: data.items,
    rule: data.rule,
    pricing_mode: data.pricingMode,
    base_price: data.basePrice,
    discounted_price: data.discountedPrice,
    savings_percentage: data.savingsPercentage,
    cover_mode: data.coverMode,
    image: data.image,
    cover_product_ids: data.coverProductIds,
    category: data.category,
    tagline: data.tagline,
    highlights: data.highlights,
    tier: data.tier,
    is_signature: data.isSignature,
    is_active: data.isActive,
  });
}

function mapBulkOrder(row: Record<string, unknown>): BulkOrder {
  return {
    id: String(row.id),
    customerId: String(row.customer_id ?? ''),
    items: Array.isArray(row.items) ? row.items : [],
    totalAmount: Number(row.total_amount ?? 0),
    orderType: (row.order_type as BulkOrder['orderType']) ?? 'wholesale',
    status: (row.status as BulkOrder['status']) ?? 'pending',
    notes: row.notes ? String(row.notes) : undefined,
    requestedAt: toDate(row.requested_at),
    approvedAt: row.approved_at ? toDate(row.approved_at) : undefined,
    shippedAt: row.shipped_at ? toDate(row.shipped_at) : undefined,
  };
}

function bulkOrderToRow(data: Partial<BulkOrder> & { id?: string }): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    customer_id: data.customerId,
    items: data.items,
    total_amount: data.totalAmount,
    order_type: data.orderType,
    status: data.status,
    notes: data.notes,
    requested_at: data.requestedAt !== undefined ? toIso(data.requestedAt) : undefined,
    approved_at: data.approvedAt !== undefined ? toIso(data.approvedAt) : undefined,
    shipped_at: data.shippedAt !== undefined ? toIso(data.shippedAt) : undefined,
  });
}

function mapWholesaleAccount(row: Record<string, unknown>): WholesaleAccount {
  return {
    id: String(row.id),
    customerId: String(row.customer_id ?? ''),
    companyName: String(row.company_name ?? ''),
    taxId: row.tax_id ? String(row.tax_id) : undefined,
    status: (row.status as WholesaleAccount['status']) ?? 'pending',
    discount: row.discount != null ? Number(row.discount) : undefined,
    creditLimit: row.credit_limit != null ? Number(row.credit_limit) : undefined,
    createdAt: toDate(row.created_at),
    approvedAt: row.approved_at ? toDate(row.approved_at) : undefined,
  };
}

function wholesaleAccountToRow(
  data: Partial<WholesaleAccount> & { id?: string }
): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    customer_id: data.customerId,
    company_name: data.companyName,
    tax_id: data.taxId,
    status: data.status,
    discount: data.discount,
    credit_limit: data.creditLimit,
    created_at: data.createdAt !== undefined ? toIso(data.createdAt) : undefined,
    approved_at: data.approvedAt !== undefined ? toIso(data.approvedAt) : undefined,
  });
}

async function fetchPackages(): Promise<Package[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.packages)
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapPackage(row as Record<string, unknown>));
}

async function fetchBulkOrders(): Promise<BulkOrder[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.bulkOrders)
    .select('*')
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapBulkOrder(row as Record<string, unknown>));
}

async function fetchWholesaleAccounts(): Promise<WholesaleAccount[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.wholesaleAccounts)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapWholesaleAccount(row as Record<string, unknown>));
}

export async function getPackage(id: string): Promise<Package | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLES.packages)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapPackage(data as Record<string, unknown>);
}

export function subscribePackages(
  onData: (packages: Package[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.packages, fetchPackages, onData, onError);
}

export async function savePackage(
  pkg: Omit<Package, 'createdAt' | 'updatedAt'> & { createdAt?: Date; updatedAt?: Date }
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = pkg;
  const payload = packageToRow({ ...data, id });

  const { data: existing } = await supabase
    .from(TABLES.packages)
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from(TABLES.packages).update(payload).eq('id', id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from(TABLES.packages).insert({ ...payload, id });
  if (error) throw error;
}

export async function deletePackage(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from(TABLES.packages).delete().eq('id', id);
  if (error) throw error;
}

export function subscribeBulkOrders(
  onData: (orders: BulkOrder[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.bulkOrders, fetchBulkOrders, onData, onError);
}

export async function saveBulkOrder(order: BulkOrder): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { id, requestedAt, approvedAt, shippedAt, ...data } = order;
  const { error } = await supabase.from(TABLES.bulkOrders).upsert({
    ...bulkOrderToRow({ ...data, id }),
    requested_at: toIso(requestedAt) ?? new Date().toISOString(),
    approved_at: toIso(approvedAt),
    shipped_at: toIso(shippedAt),
  });

  if (error) throw error;

  if (order.status === 'pending') {
    void import('@/lib/pwa/notify-client').then(({ notifyAdminBulkOrderClients }) =>
      notifyAdminBulkOrderClients(id)
    );
  }
}

export async function updateBulkOrder(
  id: string,
  updates: Partial<BulkOrder>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { id: _id, requestedAt: _requestedAt, approvedAt, shippedAt, ...data } = updates;
  const payload = bulkOrderToRow(data);

  if (approvedAt) {
    payload.approved_at = toIso(approvedAt);
  }
  if (shippedAt) {
    payload.shipped_at = toIso(shippedAt);
  }

  const { error } = await supabase.from(TABLES.bulkOrders).update(payload).eq('id', id);
  if (error) throw error;
}

export function subscribeWholesaleAccounts(
  onData: (accounts: WholesaleAccount[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.wholesaleAccounts, fetchWholesaleAccounts, onData, onError);
}

export async function saveWholesaleAccount(
  account: Omit<WholesaleAccount, 'createdAt'> & { createdAt?: Date }
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { id, createdAt, approvedAt, ...data } = account;
  const { error } = await supabase.from(TABLES.wholesaleAccounts).upsert({
    ...wholesaleAccountToRow({ ...data, id }),
    created_at: toIso(createdAt) ?? new Date().toISOString(),
    approved_at: toIso(approvedAt),
  });

  if (error) throw error;

  if (data.status === 'pending') {
    void import('@/lib/pwa/notify-client').then(({ notifyAdminWholesaleAccountClients }) =>
      notifyAdminWholesaleAccountClients(id)
    );
  }
}

export async function updateWholesaleAccountStatus(
  id: string,
  status: WholesaleAccount['status']
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const payload: Record<string, unknown> = { status };
  if (status === 'approved') {
    payload.approved_at = new Date().toISOString();
  }

  const { error } = await supabase.from(TABLES.wholesaleAccounts).update(payload).eq('id', id);
  if (error) throw error;
}
