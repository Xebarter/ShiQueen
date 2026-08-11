export type SupplierCategory = 'products' | 'packages' | 'services';

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
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SUPPLIER_ID = 'supplier-shequeen-default';

export const SUPPLIER_CATEGORY_OPTIONS: { id: SupplierCategory; label: string }[] = [
  { id: 'products', label: 'Products' },
  { id: 'packages', label: 'Packages' },
  { id: 'services', label: 'Services' },
];
