import { getSupabaseClient } from '@/lib/supabase/client';
import { generateId } from '@/lib/supabase/ids';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import { Product } from '@/lib/types/database';
import { DEFAULT_SUPPLIER_ID } from '@/lib/types/suppliers';

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    sku: String(row.sku ?? ''),
    description: String(row.description ?? ''),
    category: String(row.category ?? ''),
    supplierId: String(row.supplier_id ?? DEFAULT_SUPPLIER_ID),
    price: Number(row.price ?? 0),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    wholesalePrice: row.wholesale_price != null ? Number(row.wholesale_price) : undefined,
    stock: Number(row.stock ?? 0),
    rating: Number(row.rating ?? 0),
    reviews: Number(row.reviews ?? 0),
    image: String(row.image ?? ''),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    sizes: Array.isArray(row.sizes) ? (row.sizes as string[]) : [],
    colors: Array.isArray(row.colors) ? (row.colors as string[]) : [],
    details: Array.isArray(row.details) ? (row.details as string[]) : [],
    isWholesaleEnabled: Boolean(row.is_wholesale_enabled ?? true),
    isRetailEnabled: row.is_retail_enabled !== false,
    minOrderQuantity: Number(row.min_order_quantity ?? 10),
    maxOrderQuantity:
      row.max_order_quantity === null || row.max_order_quantity === undefined
        ? null
        : Number(row.max_order_quantity),
    status: (row.status as Product['status']) ?? 'Active',
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function productToRow(data: Partial<Product> & { id?: string }): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    name: data.name,
    sku: data.sku,
    description: data.description,
    category: data.category,
    supplier_id: data.supplierId,
    price: data.price,
    original_price: data.originalPrice,
    wholesale_price: data.wholesalePrice,
    stock: data.stock,
    rating: data.rating,
    reviews: data.reviews,
    image: data.image,
    images: data.images,
    sizes: data.sizes,
    colors: data.colors,
    details: data.details,
    is_wholesale_enabled: data.isWholesaleEnabled,
    is_retail_enabled: data.isRetailEnabled,
    min_order_quantity: data.minOrderQuantity,
    max_order_quantity: data.maxOrderQuantity,
    status: data.status,
  });
}

async function fetchProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.products)
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
}

export async function getProducts(): Promise<Product[]> {
  return fetchProducts();
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from(TABLES.products).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProduct(data as Record<string, unknown>);
}

export function subscribeProducts(
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.products, fetchProducts, onData, onError);
}

export async function createProduct(
  product: Omit<Product, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from(TABLES.products).insert(productToRow(product));
  if (error) throw error;
}

export function generateProductId(): string {
  return `prod-${generateId()}`;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { id: _id, createdAt, updatedAt, ...rest } = updates;
  const payload = productToRow({ ...rest, id });

  const { data: existing } = await supabase.from(TABLES.products).select('id').eq('id', id).maybeSingle();

  if (existing) {
    const { error } = await supabase.from(TABLES.products).update(payload).eq('id', id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from(TABLES.products).insert({ ...payload, id });
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');
  const { error } = await supabase.from(TABLES.products).delete().eq('id', id);
  if (error) throw error;
}
