'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Package, BulkOrder, WholesaleAccount } from '@/lib/types/wholesale';
import {
  subscribePackages,
  subscribeBulkOrders,
  subscribeWholesaleAccounts,
  savePackage,
  deletePackage as deletePackageFromDb,
  saveBulkOrder,
  updateBulkOrder as updateBulkOrderInDb,
  saveWholesaleAccount,
  updateWholesaleAccountStatus as updateAccountStatusInDb,
} from '@/lib/firebase/wholesale';
import { ensureDatabaseSeeded } from '@/lib/firebase/seed';
import { SEED_PACKAGES } from '@/lib/firebase/seed-data';
import { readCatalogCache, writeCatalogCache } from '@/lib/catalog-cache';

interface WholesaleContextType {
  packages: Package[];
  loading: boolean;
  addPackage: (pkg: Package) => Promise<void>;
  updatePackage: (id: string, pkg: Partial<Package>) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;

  bulkOrders: BulkOrder[];
  createBulkOrder: (order: BulkOrder) => Promise<void>;
  updateBulkOrder: (id: string, order: Partial<BulkOrder>) => Promise<void>;

  wholesaleAccounts: WholesaleAccount[];
  applyForAccount: (data: Omit<WholesaleAccount, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateAccountStatus: (id: string, status: WholesaleAccount['status']) => Promise<void>;

  isWholesaleMode: boolean;
  setWholesaleMode: (mode: boolean) => void;
  selectedPackage: Package | null;
  setSelectedPackage: (pkg: Package | null) => void;
}

const WholesaleContext = createContext<WholesaleContextType | undefined>(undefined);

const FALLBACK_PACKAGES: Package[] = SEED_PACKAGES.map((pkg) => ({
  ...pkg,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

function needsWholesaleAdminData(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/wholesale') ||
    pathname.startsWith('/suppliers')
  );
}

export function WholesaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [packages, setPackages] = useState<Package[]>([]);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [wholesaleAccounts, setWholesaleAccounts] = useState<WholesaleAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWholesaleMode, setWholesaleMode] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  useEffect(() => {
    const cached = readCatalogCache<Package>('packages');
    if (cached?.length) {
      setPackages(cached);
      setLoading(false);
    }

    const unsubscribe = subscribePackages(
      (nextPackages) => {
        const source = nextPackages.length > 0 ? nextPackages : FALLBACK_PACKAGES;
        setPackages(source);
        writeCatalogCache('packages', source);
        setLoading(false);
      },
      () => {
        setPackages((prev) => (prev.length > 0 ? prev : FALLBACK_PACKAGES));
        setLoading(false);
      }
    );

    void ensureDatabaseSeeded();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!needsWholesaleAdminData(pathname)) return;
    const unsubscribers = [
      subscribeBulkOrders(setBulkOrders),
      subscribeWholesaleAccounts(setWholesaleAccounts),
    ];
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [pathname]);

  const addPackage = async (pkg: Package) => {
    await savePackage(pkg);
  };

  const updatePackage = async (id: string, updates: Partial<Package>) => {
    const existing = packages.find((pkg) => pkg.id === id);
    if (!existing) {
      throw new Error('Package not found in local state. Refresh and try again.');
    }
    await savePackage({ ...existing, ...updates, id });
  };

  const deletePackage = async (id: string) => {
    await deletePackageFromDb(id);
  };

  const createBulkOrder = async (order: BulkOrder) => {
    await saveBulkOrder(order);
  };

  const updateBulkOrder = async (id: string, updates: Partial<BulkOrder>) => {
    await updateBulkOrderInDb(id, updates);
  };

  const applyForAccount = async (
    data: Omit<WholesaleAccount, 'id' | 'status' | 'createdAt'>
  ) => {
    const account: WholesaleAccount = {
      ...data,
      id: `acc-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
    };
    await saveWholesaleAccount(account);
  };

  const updateAccountStatus = async (id: string, status: WholesaleAccount['status']) => {
    await updateAccountStatusInDb(id, status);
  };

  return (
    <WholesaleContext.Provider
      value={{
        packages,
        loading,
        addPackage,
        updatePackage,
        deletePackage,
        bulkOrders,
        createBulkOrder,
        updateBulkOrder,
        wholesaleAccounts,
        applyForAccount,
        updateAccountStatus,
        isWholesaleMode,
        setWholesaleMode,
        selectedPackage,
        setSelectedPackage,
      }}
    >
      {children}
    </WholesaleContext.Provider>
  );
}

export function useWholesale() {
  const context = useContext(WholesaleContext);
  if (context === undefined) {
    throw new Error('useWholesale must be used within WholesaleProvider');
  }
  return context;
}
