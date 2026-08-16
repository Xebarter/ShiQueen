import { getSupabaseClient } from '@/lib/supabase/client';
import { generateId } from '@/lib/supabase/ids';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate, toIso } from '@/lib/supabase/timestamp';
import {
  DEFAULT_SUPPLIER_ID,
  type Supplier,
  type SupplierCategory,
} from '@/lib/types/suppliers';

function mapSupplier(row: Record<string, unknown>): Supplier {
  const categories = Array.isArray(row.categories)
    ? (row.categories as string[]).filter((c): c is SupplierCategory =>
        c === 'products' || c === 'packages' || c === 'services'
      )
    : (['products', 'packages', 'services'] as SupplierCategory[]);

  const rawStatus = String(row.approval_status ?? '');
  const approvalStatus =
    rawStatus === 'pending' ||
    rawStatus === 'approved' ||
    rawStatus === 'rejected' ||
    rawStatus === 'suspended'
      ? rawStatus
      : 'approved';

  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    companyName: String(row.company_name ?? ''),
    contactName: String(row.contact_name ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    whatsapp: String(row.whatsapp ?? row.phone ?? ''),
    address: String(row.address ?? ''),
    city: String(row.city ?? ''),
    notes: String(row.notes ?? ''),
    logo: String(row.logo ?? row.profile_image ?? ''),
    categories,
    isDefault: Boolean(row.is_default ?? false),
    isActive: Boolean(row.is_active ?? true),
    approvalStatus,
    ownerUid: row.owner_uid ? String(row.owner_uid) : null,
    approvedAt: row.approved_at ? toDate(row.approved_at) : undefined,
    rejectedAt: row.rejected_at ? toDate(row.rejected_at) : undefined,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function supplierToRow(data: Partial<Supplier> & { id?: string }): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    name: data.name,
    company_name: data.companyName,
    contact_name: data.contactName,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp,
    address: data.address,
    city: data.city,
    notes: data.notes,
    logo: data.logo,
    categories: data.categories,
    is_default: data.isDefault,
    is_active: data.isActive,
    approval_status: data.approvalStatus,
    owner_uid: data.ownerUid,
    approved_at: data.approvedAt !== undefined ? toIso(data.approvedAt) : undefined,
    rejected_at: data.rejectedAt !== undefined ? toIso(data.rejectedAt) : undefined,
    rejection_reason: data.rejectionReason,
  });
}

async function fetchSuppliers(): Promise<Supplier[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.suppliers)
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapSupplier(row as Record<string, unknown>));
}

function resolveSupplierId(raw: unknown): string {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return DEFAULT_SUPPLIER_ID;
  }
  return String(raw);
}

async function countCatalogForSupplier(
  table: string,
  supplierId: string
): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  if (supplierId === DEFAULT_SUPPLIER_ID) {
    const { data, error } = await supabase.from(table).select('supplier_id');
    if (error) throw error;
    return (data ?? []).filter(
      (row) => resolveSupplierId((row as { supplier_id?: unknown }).supplier_id) === supplierId
    ).length;
  }

  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('supplier_id', supplierId);

  if (error) throw error;
  return count ?? 0;
}

async function fetchCatalogRows(table: string): Promise<Array<{ id: string; supplier_id: unknown }>> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from(table).select('id, supplier_id');
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; supplier_id: unknown }>;
}

export function buildDefaultSupplier(): Omit<Supplier, 'createdAt' | 'updatedAt'> {
  return {
    id: DEFAULT_SUPPLIER_ID,
    name: 'ShiQueen',
    companyName: 'ShiQueen',
    contactName: 'ShiQueen Team',
    email: 'hello@shiqueen.com',
    phone: '',
    whatsapp: '',
    address: '',
    city: 'Kampala',
    notes: 'Default catalog supplier for products, packages, and services.',
    logo: '',
    categories: ['products', 'packages', 'services'],
    isDefault: true,
    isActive: true,
    approvalStatus: 'approved',
    ownerUid: null,
    approvedAt: new Date(),
  };
}

export async function getSuppliers(): Promise<Supplier[]> {
  return fetchSuppliers();
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLES.suppliers)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapSupplier(data as Record<string, unknown>);
}

export function subscribeSuppliers(
  onData: (suppliers: Supplier[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.suppliers, fetchSuppliers, onData, onError);
}

export function generateSupplierId(): string {
  return `supplier-${generateId()}`;
}

async function clearOtherDefaults(exceptId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from(TABLES.suppliers)
    .update({ is_default: false })
    .eq('is_default', true)
    .neq('id', exceptId);

  if (error) throw error;
}

export async function createSupplier(
  supplier: Omit<Supplier, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  if (supplier.isDefault) {
    await clearOtherDefaults(supplier.id);
  }

  const { id, ...data } = supplier;
  const { error } = await supabase.from(TABLES.suppliers).insert(supplierToRow({ ...data, id }));

  if (error) throw error;

  if (supplier.approvalStatus === 'pending') {
    void import('@/lib/pwa/notify-client').then(({ notifyAdminApprovalClients }) =>
      notifyAdminApprovalClients('supplier', id)
    );
  }
}

export async function updateSupplier(
  id: string,
  data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  if (data.isDefault === true) {
    await clearOtherDefaults(id);
  }

  const { error } = await supabase.from(TABLES.suppliers).update(supplierToRow(data)).eq('id', id);
  if (error) throw error;
}

export type SupplierCatalogCounts = {
  products: number;
  packages: number;
  services: number;
  total: number;
};

export async function getSupplierCatalogCounts(
  supplierId: string
): Promise<SupplierCatalogCounts> {
  const [products, packages, services] = await Promise.all([
    countCatalogForSupplier(TABLES.products, supplierId),
    countCatalogForSupplier(TABLES.packages, supplierId),
    countCatalogForSupplier(TABLES.services, supplierId),
  ]);

  return {
    products,
    packages,
    services,
    total: products + packages + services,
  };
}

export async function getAllSupplierCatalogCounts(): Promise<
  Record<string, SupplierCatalogCounts>
> {
  const [products, packages, services] = await Promise.all([
    fetchCatalogRows(TABLES.products),
    fetchCatalogRows(TABLES.packages),
    fetchCatalogRows(TABLES.services),
  ]);

  const counts: Record<string, SupplierCatalogCounts> = {};

  const bump = (rawSupplierId: unknown, key: 'products' | 'packages' | 'services') => {
    const id = resolveSupplierId(rawSupplierId);
    if (!counts[id]) {
      counts[id] = { products: 0, packages: 0, services: 0, total: 0 };
    }
    counts[id][key] += 1;
    counts[id].total += 1;
  };

  for (const row of products) bump(row.supplier_id, 'products');
  for (const row of packages) bump(row.supplier_id, 'packages');
  for (const row of services) bump(row.supplier_id, 'services');

  return counts;
}

export async function deleteSupplier(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  if (id === DEFAULT_SUPPLIER_ID) {
    throw new Error('The default ShiQueen supplier cannot be deleted.');
  }

  const supplier = await getSupplier(id);
  if (supplier?.isDefault) {
    throw new Error('Set another supplier as default before deleting this one.');
  }

  const counts = await getSupplierCatalogCounts(id);
  if (counts.total > 0) {
    const defaultSupplier = await ensureDefaultSupplier();
    await reassignCatalogToSupplier(id, defaultSupplier.id);
  }

  const { error } = await supabase.from(TABLES.suppliers).delete().eq('id', id);
  if (error) throw error;
}

async function reassignCatalogToSupplier(
  fromSupplierId: string,
  toSupplierId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const updates = await Promise.all([
    supabase.from(TABLES.products).update({ supplier_id: toSupplierId }).eq('supplier_id', fromSupplierId),
    supabase.from(TABLES.packages).update({ supplier_id: toSupplierId }).eq('supplier_id', fromSupplierId),
    supabase.from(TABLES.services).update({ supplier_id: toSupplierId }).eq('supplier_id', fromSupplierId),
  ]);

  for (const { error } of updates) {
    if (error) throw error;
  }
}

export async function ensureDefaultSupplier(): Promise<Supplier> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const fallback = buildDefaultSupplier();
    return { ...fallback, createdAt: new Date(), updatedAt: new Date() };
  }

  const existing = await getSupplier(DEFAULT_SUPPLIER_ID);
  if (existing) {
    const needsPatch =
      !existing.isDefault ||
      !existing.isActive ||
      existing.approvalStatus !== 'approved';
    if (needsPatch) {
      await updateSupplier(DEFAULT_SUPPLIER_ID, {
        isDefault: true,
        isActive: true,
        approvalStatus: 'approved',
        approvedAt: existing.approvedAt ?? new Date(),
      });
      return {
        ...existing,
        isDefault: true,
        isActive: true,
        approvalStatus: 'approved',
        approvedAt: existing.approvedAt ?? new Date(),
      };
    }
    return existing;
  }

  const defaults = buildDefaultSupplier();
  await createSupplier(defaults);
  return { ...defaults, createdAt: new Date(), updatedAt: new Date() };
}

/** Backfill approvalStatus on legacy supplier docs missing it. */
export async function backfillSupplierApprovalStatus(): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  const { data, error } = await supabase.from(TABLES.suppliers).select('id, approval_status, owner_uid');
  if (error) throw error;

  const ids = (data ?? [])
    .filter((row) => row.approval_status == null)
    .map((row) => String(row.id));

  if (ids.length === 0) return 0;

  const { error: updateError } = await supabase
    .from(TABLES.suppliers)
    .update({ approval_status: 'approved' })
    .in('id', ids);

  if (updateError) throw updateError;
  return ids.length;
}

export async function setSupplierApprovalStatus(
  id: string,
  approvalStatus: Supplier['approvalStatus'],
  options?: { rejectionReason?: string }
): Promise<void> {
  const patch: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>> = {
    approvalStatus,
  };

  if (approvalStatus === 'approved') {
    patch.isActive = true;
    patch.approvedAt = new Date();
    patch.rejectionReason = '';
  } else if (approvalStatus === 'rejected') {
    patch.isActive = false;
    patch.rejectedAt = new Date();
    patch.rejectionReason = options?.rejectionReason?.trim() || '';
  } else if (approvalStatus === 'suspended') {
    patch.isActive = false;
  } else if (approvalStatus === 'pending') {
    patch.isActive = false;
  }

  await updateSupplier(id, patch);
}

export type SupplierRegistrationInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  city: string;
  notes?: string;
  categories: SupplierCategory[];
};

/** Create a pending supplier owned by the given auth user and link the user profile. */
export async function linkSupplierRegistration(
  uid: string,
  input: SupplierRegistrationInput
): Promise<{ supplierId: string }> {
  const email = input.email.trim().toLowerCase();
  const companyName = input.companyName.trim();
  const contactName = input.contactName.trim();
  const phone = input.phone.trim();
  const supplierId = generateSupplierId();

  await createSupplier({
    id: supplierId,
    name: companyName,
    companyName,
    contactName,
    email,
    phone,
    whatsapp: (input.whatsapp || phone).trim(),
    address: (input.address || '').trim(),
    city: input.city.trim(),
    notes: (input.notes || '').trim(),
    logo: '',
    categories: input.categories.length > 0 ? input.categories : ['products', 'packages'],
    isDefault: false,
    isActive: false,
    approvalStatus: 'pending',
    ownerUid: uid,
  });

  const { createUserProfile, getUserProfile, updateUserProfile } = await import(
    '@/lib/supabase/users'
  );

  const existing = await getUserProfile(uid);
  const nextRole =
    existing?.role === 'admin' || existing?.role === 'service_provider'
      ? existing.role
      : 'supplier';
  if (existing) {
    await updateUserProfile(uid, {
      role: nextRole,
      supplierId,
      displayName: contactName,
    });
  } else {
    await createUserProfile(uid, email, contactName, {
      role: 'supplier',
      supplierId,
    });
  }

  return { supplierId };
}

/** Assign default supplierId to any catalog docs missing it. Idempotent. */
export async function backfillCatalogSupplierIds(
  supplierId: string = DEFAULT_SUPPLIER_ID
): Promise<{ products: number; packages: number; services: number }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { products: 0, packages: 0, services: 0 };

  const backfillTable = async (table: string): Promise<number> => {
    const rows = await fetchCatalogRows(table);
    const ids = rows
      .filter((row) => {
        const raw = row.supplier_id;
        return raw === undefined || raw === null || String(raw).trim() === '';
      })
      .map((row) => row.id);

    if (ids.length === 0) return 0;

    const { error } = await supabase.from(table).update({ supplier_id: supplierId }).in('id', ids);
    if (error) throw error;
    return ids.length;
  };

  const [products, packages, services] = await Promise.all([
    backfillTable(TABLES.products),
    backfillTable(TABLES.packages),
    backfillTable(TABLES.services),
  ]);

  return { products, packages, services };
}

export async function ensureSuppliersReady(): Promise<Supplier> {
  try {
    return await ensureDefaultSupplier();
  } catch (error) {
    if (isPermissionDenied(error)) {
      const fallback = buildDefaultSupplier();
      return { ...fallback, createdAt: new Date(), updatedAt: new Date() };
    }
    throw error;
  }
}

function isPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = String((error as { code?: string }).code ?? '');
  const message = String((error as { message?: string }).message ?? '').toLowerCase();
  return (
    code === '42501' ||
    code === 'PGRST301' ||
    message.includes('permission denied') ||
    message.includes('row-level security')
  );
}
