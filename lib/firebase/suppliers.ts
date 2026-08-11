import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';
import {
  DEFAULT_SUPPLIER_ID,
  type Supplier,
  type SupplierCategory,
} from '@/lib/types/suppliers';

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function mapSupplier(id: string, data: Record<string, unknown>): Supplier {
  const categories = Array.isArray(data.categories)
    ? (data.categories as string[]).filter((c): c is SupplierCategory =>
        c === 'products' || c === 'packages' || c === 'services'
      )
    : (['products', 'packages', 'services'] as SupplierCategory[]);

  return {
    id,
    name: String(data.name ?? ''),
    companyName: String(data.companyName ?? ''),
    contactName: String(data.contactName ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    whatsapp: String(data.whatsapp ?? data.phone ?? ''),
    address: String(data.address ?? ''),
    city: String(data.city ?? ''),
    notes: String(data.notes ?? ''),
    categories,
    isDefault: Boolean(data.isDefault ?? false),
    isActive: Boolean(data.isActive ?? true),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function buildDefaultSupplier(): Omit<Supplier, 'createdAt' | 'updatedAt'> {
  return {
    id: DEFAULT_SUPPLIER_ID,
    name: 'SheQueen',
    companyName: 'SheQueen',
    contactName: 'SheQueen Team',
    email: 'hello@shequeen.com',
    phone: '',
    whatsapp: '',
    address: '',
    city: 'Kampala',
    notes: 'Default catalog supplier for products, packages, and services.',
    categories: ['products', 'packages', 'services'],
    isDefault: true,
    isActive: true,
  };
}

export async function getSuppliers(): Promise<Supplier[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.suppliers), orderBy('name'))
  );
  return snapshot.docs.map((docSnap) => mapSupplier(docSnap.id, docSnap.data()));
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const snap = await getDoc(doc(db, COLLECTIONS.suppliers, id));
  if (!snap.exists()) return null;
  return mapSupplier(snap.id, snap.data());
}

export function subscribeSuppliers(
  onData: (suppliers: Supplier[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.suppliers), orderBy('name')),
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => mapSupplier(docSnap.id, docSnap.data())));
    },
    (error) => onError?.(error)
  );
}

export function generateSupplierId(): string {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  return doc(collection(db, COLLECTIONS.suppliers)).id;
}

async function clearOtherDefaults(exceptId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const snapshot = await getDocs(collection(db, COLLECTIONS.suppliers));
  const batch = writeBatch(db);
  let ops = 0;

  for (const docSnap of snapshot.docs) {
    if (docSnap.id === exceptId) continue;
    if (docSnap.data().isDefault) {
      batch.update(docSnap.ref, { isDefault: false, updatedAt: serverTimestamp() });
      ops += 1;
    }
  }

  if (ops > 0) await batch.commit();
}

export async function createSupplier(
  supplier: Omit<Supplier, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  if (supplier.isDefault) {
    await clearOtherDefaults(supplier.id);
  }

  const { id, ...data } = supplier;
  await setDoc(doc(db, COLLECTIONS.suppliers, id), {
    ...stripUndefined(data as Record<string, unknown>),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSupplier(
  id: string,
  data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  if (data.isDefault === true) {
    await clearOtherDefaults(id);
  }

  await updateDoc(doc(db, COLLECTIONS.suppliers, id), {
    ...stripUndefined(data as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
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
  const db = getFirebaseDb();
  if (!db) return { products: 0, packages: 0, services: 0, total: 0 };

  const [productsSnap, packagesSnap, servicesSnap] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.products)),
    getDocs(collection(db, COLLECTIONS.packages)),
    getDocs(collection(db, COLLECTIONS.services)),
  ]);

  const products = productsSnap.docs.filter(
    (d) => String(d.data().supplierId ?? DEFAULT_SUPPLIER_ID) === supplierId
  ).length;
  const packages = packagesSnap.docs.filter(
    (d) => String(d.data().supplierId ?? DEFAULT_SUPPLIER_ID) === supplierId
  ).length;
  const services = servicesSnap.docs.filter(
    (d) => String(d.data().supplierId ?? DEFAULT_SUPPLIER_ID) === supplierId
  ).length;

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
  const db = getFirebaseDb();
  if (!db) return {};

  const [productsSnap, packagesSnap, servicesSnap] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.products)),
    getDocs(collection(db, COLLECTIONS.packages)),
    getDocs(collection(db, COLLECTIONS.services)),
  ]);

  const counts: Record<string, SupplierCatalogCounts> = {};

  const bump = (supplierId: string, key: 'products' | 'packages' | 'services') => {
    const id = supplierId || DEFAULT_SUPPLIER_ID;
    if (!counts[id]) {
      counts[id] = { products: 0, packages: 0, services: 0, total: 0 };
    }
    counts[id][key] += 1;
    counts[id].total += 1;
  };

  for (const d of productsSnap.docs) {
    bump(String(d.data().supplierId ?? DEFAULT_SUPPLIER_ID), 'products');
  }
  for (const d of packagesSnap.docs) {
    bump(String(d.data().supplierId ?? DEFAULT_SUPPLIER_ID), 'packages');
  }
  for (const d of servicesSnap.docs) {
    bump(String(d.data().supplierId ?? DEFAULT_SUPPLIER_ID), 'services');
  }

  return counts;
}

export async function deleteSupplier(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  if (id === DEFAULT_SUPPLIER_ID) {
    throw new Error('The default SheQueen supplier cannot be deleted.');
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

  await deleteDoc(doc(db, COLLECTIONS.suppliers, id));
}

async function reassignCatalogToSupplier(
  fromSupplierId: string,
  toSupplierId: string
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const [productsSnap, packagesSnap, servicesSnap] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.products)),
    getDocs(collection(db, COLLECTIONS.packages)),
    getDocs(collection(db, COLLECTIONS.services)),
  ]);

  const batch = writeBatch(db);
  let ops = 0;

  const maybeReassign = (
    docSnap: { id: string; data: () => Record<string, unknown> },
    collectionName: string
  ) => {
    const current = String(docSnap.data().supplierId ?? '');
    if (current === fromSupplierId) {
      batch.update(doc(db, collectionName, docSnap.id), {
        supplierId: toSupplierId,
        updatedAt: serverTimestamp(),
      });
      ops += 1;
    }
  };

  for (const d of productsSnap.docs) maybeReassign(d, COLLECTIONS.products);
  for (const d of packagesSnap.docs) maybeReassign(d, COLLECTIONS.packages);
  for (const d of servicesSnap.docs) maybeReassign(d, COLLECTIONS.services);

  if (ops > 0) await batch.commit();
}

export async function ensureDefaultSupplier(): Promise<Supplier> {
  const db = getFirebaseDb();
  if (!db) {
    const fallback = buildDefaultSupplier();
    return { ...fallback, createdAt: new Date(), updatedAt: new Date() };
  }

  const existing = await getSupplier(DEFAULT_SUPPLIER_ID);
  if (existing) {
    if (!existing.isDefault || !existing.isActive) {
      await updateSupplier(DEFAULT_SUPPLIER_ID, { isDefault: true, isActive: true });
      return { ...existing, isDefault: true, isActive: true };
    }
    return existing;
  }

  const defaults = buildDefaultSupplier();
  await createSupplier(defaults);
  return { ...defaults, createdAt: new Date(), updatedAt: new Date() };
}

/** Assign default supplierId to any catalog docs missing it. Idempotent. */
export async function backfillCatalogSupplierIds(
  supplierId: string = DEFAULT_SUPPLIER_ID
): Promise<{ products: number; packages: number; services: number }> {
  const db = getFirebaseDb();
  if (!db) return { products: 0, packages: 0, services: 0 };

  const [productsSnap, packagesSnap, servicesSnap] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.products)),
    getDocs(collection(db, COLLECTIONS.packages)),
    getDocs(collection(db, COLLECTIONS.services)),
  ]);

  let products = 0;
  let packages = 0;
  let services = 0;

  const commitBatch = async (
    docs: typeof productsSnap.docs,
    collectionName: string,
    bump: () => void
  ) => {
    let batch = writeBatch(db);
    let ops = 0;

    for (const docSnap of docs) {
      const raw = docSnap.data().supplierId;
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') continue;

      batch.update(doc(db, collectionName, docSnap.id), {
        supplierId,
        updatedAt: serverTimestamp(),
      });
      bump();
      ops += 1;

      if (ops >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }

    if (ops > 0) await batch.commit();
  };

  await commitBatch(productsSnap.docs, COLLECTIONS.products, () => {
    products += 1;
  });
  await commitBatch(packagesSnap.docs, COLLECTIONS.packages, () => {
    packages += 1;
  });
  await commitBatch(servicesSnap.docs, COLLECTIONS.services, () => {
    services += 1;
  });

  return { products, packages, services };
}

export async function ensureSuppliersReady(): Promise<Supplier> {
  try {
    const supplier = await ensureDefaultSupplier();
    try {
      await backfillCatalogSupplierIds(supplier.id);
    } catch (error) {
      // Backfill needs admin write access on catalog collections.
      if (!isPermissionDenied(error)) throw error;
    }
    return supplier;
  } catch (error) {
    if (isPermissionDenied(error)) {
      const fallback = buildDefaultSupplier();
      return { ...fallback, createdAt: new Date(), updatedAt: new Date() };
    }
    throw error;
  }
}

function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'permission-denied'
  );
}
