import type { Supplier } from '@/lib/types/suppliers';
import { DEFAULT_SUPPLIER_ID } from '@/lib/types/suppliers';

/** Storefront may show catalog from this supplier. */
export function isSupplierPubliclyVisible(
  supplier: Pick<Supplier, 'approvalStatus' | 'isActive'> | null | undefined
): boolean {
  if (!supplier) return false;
  return supplier.approvalStatus === 'approved' && supplier.isActive;
}

export function isCatalogSupplierVisible(
  supplierId: string | undefined | null,
  suppliersById: Map<string, Pick<Supplier, 'approvalStatus' | 'isActive'>>
): boolean {
  const id = supplierId?.trim() || DEFAULT_SUPPLIER_ID;
  const supplier = suppliersById.get(id);
  // Missing supplier docs: treat default as visible for seed/fallback; others hidden.
  if (!supplier) return id === DEFAULT_SUPPLIER_ID;
  return isSupplierPubliclyVisible(supplier);
}

export function buildSuppliersById(
  suppliers: Array<Pick<Supplier, 'id' | 'approvalStatus' | 'isActive'>>
): Map<string, Pick<Supplier, 'approvalStatus' | 'isActive'>> {
  return new Map(
    suppliers.map((s) => [s.id, { approvalStatus: s.approvalStatus, isActive: s.isActive }])
  );
}
