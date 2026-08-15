'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createSupplier,
  deleteSupplier,
  ensureSuppliersReady,
  generateSupplierId,
  subscribeSuppliers,
  updateSupplier,
} from '@/lib/firebase/suppliers';
import { buildDefaultSupplier } from '@/lib/firebase/suppliers';
import {
  DEFAULT_SUPPLIER_ID,
  type Supplier,
} from '@/lib/types/suppliers';
import { readCatalogCache, writeCatalogCache } from '@/lib/catalog-cache';

type SuppliersContextType = {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  defaultSupplierId: string;
  getSupplierById: (id: string) => Supplier | undefined;
  getDefaultSupplier: () => Supplier | undefined;
  refreshReady: () => Promise<void>;
  create: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<string>;
  update: (id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const SuppliersContext = createContext<SuppliersContextType | undefined>(undefined);

const FALLBACK_SUPPLIERS: Supplier[] = [
  {
    ...buildDefaultSupplier(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function SuppliersProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshReady = useCallback(async () => {
    await ensureSuppliersReady();
  }, []);

  useEffect(() => {
    const cached = readCatalogCache<Supplier>('suppliers');
    if (cached?.length) {
      setSuppliers(cached);
      setLoading(false);
    }

    const unsubscribe = subscribeSuppliers(
      (next) => {
        const source = next.length > 0 ? next : FALLBACK_SUPPLIERS;
        setSuppliers(source);
        writeCatalogCache('suppliers', source);
        setLoading(false);
      },
      (err) => {
        console.error('Suppliers subscription error:', err);
        setSuppliers((prev) => (prev.length > 0 ? prev : FALLBACK_SUPPLIERS));
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getSupplierById = useCallback(
    (id: string) => suppliers.find((s) => s.id === id),
    [suppliers]
  );

  const getDefaultSupplier = useCallback(() => {
    return (
      suppliers.find((s) => s.isDefault && s.isActive) ||
      suppliers.find((s) => s.id === DEFAULT_SUPPLIER_ID) ||
      suppliers.find((s) => s.isActive) ||
      suppliers[0]
    );
  }, [suppliers]);

  const defaultSupplierId = getDefaultSupplier()?.id ?? DEFAULT_SUPPLIER_ID;

  const create = useCallback(
    async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const id = data.id || generateSupplierId();
      await createSupplier({
        id,
        name: data.name,
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        address: data.address,
        city: data.city,
        notes: data.notes,
        logo: data.logo ?? '',
        categories: data.categories,
        isDefault: data.isDefault,
        isActive: data.isActive,
        approvalStatus: data.approvalStatus ?? 'approved',
        ownerUid: data.ownerUid ?? null,
        approvedAt: data.approvedAt,
        rejectedAt: data.rejectedAt,
        rejectionReason: data.rejectionReason,
      });
      return id;
    },
    []
  );

  const update = useCallback(
    async (id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>) => {
      await updateSupplier(id, data);
    },
    []
  );

  const remove = useCallback(async (id: string) => {
    await deleteSupplier(id);
  }, []);

  const value = useMemo(
    () => ({
      suppliers,
      loading,
      error,
      defaultSupplierId,
      getSupplierById,
      getDefaultSupplier,
      refreshReady,
      create,
      update,
      remove,
    }),
    [
      suppliers,
      loading,
      error,
      defaultSupplierId,
      getSupplierById,
      getDefaultSupplier,
      refreshReady,
      create,
      update,
      remove,
    ]
  );

  return <SuppliersContext.Provider value={value}>{children}</SuppliersContext.Provider>;
}

export function useSuppliers() {
  const context = useContext(SuppliersContext);
  if (context === undefined) {
    throw new Error('useSuppliers must be used within SuppliersProvider');
  }
  return context;
}
