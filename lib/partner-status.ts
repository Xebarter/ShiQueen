import type { SupplierApprovalStatus } from '@/lib/types/suppliers';

/** Partners may create/publish listings only when approved and active. */
export function canListCatalog(
  approvalStatus: SupplierApprovalStatus | undefined,
  isActive: boolean | undefined
): boolean {
  return approvalStatus === 'approved' && Boolean(isActive);
}
