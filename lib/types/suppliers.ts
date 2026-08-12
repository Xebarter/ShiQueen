export type SupplierCategory = 'products' | 'packages' | 'services';

export type SupplierApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  notes: string;
  categories: SupplierCategory[];
  isDefault: boolean;
  isActive: boolean;
  approvalStatus: SupplierApprovalStatus;
  ownerUid: string | null;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SUPPLIER_ID = 'supplier-shequeen-default';

export const SUPPLIER_CATEGORY_OPTIONS: { id: SupplierCategory; label: string }[] = [
  { id: 'products', label: 'Products' },
  { id: 'packages', label: 'Packages' },
  { id: 'services', label: 'Services' },
];

export const SUPPLIER_APPROVAL_OPTIONS: {
  id: SupplierApprovalStatus;
  label: string;
}[] = [
  { id: 'pending', label: 'Pending approval' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'suspended', label: 'Suspended' },
];
