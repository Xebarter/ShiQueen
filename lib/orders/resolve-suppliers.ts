import type { OrderItem } from '@/lib/types/database';
import { TABLES } from '@/lib/supabase/tables';

type SupplierRow = { id?: unknown; supplier_id?: unknown };

type Queryable = {
  from: (table: string) => {
    select: (columns: string) => {
      in: (
        column: string,
        values: string[]
      ) => PromiseLike<{ data: SupplierRow[] | null }>;
    };
  };
};

function asQueryable(client: unknown): Queryable {
  return client as Queryable;
}

function toSupplierMap(rows: SupplierRow[] | null | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows ?? []) {
    const id = row.id != null ? String(row.id) : '';
    const supplierId = row.supplier_id != null ? String(row.supplier_id) : '';
    if (id && supplierId) map.set(id, supplierId);
  }
  return map;
}

export function itemsForSupplier(items: OrderItem[], supplierId: string): OrderItem[] {
  return items.filter((item) => item.supplierId === supplierId);
}

export function summarizeSupplierItems(items: OrderItem[]): {
  names: string;
  quantity: number;
  subtotal: number;
} {
  const names = items
    .map((item) => item.name)
    .filter(Boolean)
    .slice(0, 3);
  const extra = items.length > 3 ? ` +${items.length - 3} more` : '';
  return {
    names: names.length > 0 ? `${names.join(', ')}${extra}` : 'your products',
    quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    subtotal: items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    ),
  };
}

/** Looks up product/package suppliers and stamps `supplierId` onto each line. */
export async function resolveOrderSuppliers(
  supabase: unknown,
  items: OrderItem[]
): Promise<{ items: OrderItem[]; supplierIds: string[] }> {
  const client = asQueryable(supabase);
  const productIds = [
    ...new Set(items.map((item) => item.productId).filter((id): id is string => Boolean(id))),
  ];
  const packageIds = [
    ...new Set(items.map((item) => item.packageId).filter((id): id is string => Boolean(id))),
  ];

  const [productsResult, packagesResult] = await Promise.all([
    productIds.length > 0
      ? client.from(TABLES.products).select('id, supplier_id').in('id', productIds)
      : Promise.resolve({ data: [] as SupplierRow[] }),
    packageIds.length > 0
      ? client.from(TABLES.packages).select('id, supplier_id').in('id', packageIds)
      : Promise.resolve({ data: [] as SupplierRow[] }),
  ]);

  const productMap = toSupplierMap(productsResult.data);
  const packageMap = toSupplierMap(packagesResult.data);
  const supplierIds = new Set<string>();

  const next = items.map((item) => {
    const supplierId =
      item.supplierId ||
      (item.packageId ? packageMap.get(item.packageId) : undefined) ||
      productMap.get(item.productId);
    if (supplierId) supplierIds.add(supplierId);
    return supplierId ? { ...item, supplierId } : item;
  });

  return { items: next, supplierIds: [...supplierIds] };
}
