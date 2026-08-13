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

  const rawStatus = String(data.approvalStatus ?? '');
  const approvalStatus =
    rawStatus === 'pending' ||
    rawStatus === 'approved' ||
    rawStatus === 'rejected' ||
    rawStatus === 'suspended'
      ? rawStatus
      : // Legacy docs without approvalStatus were admin-managed and public.
        'approved';

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
    logo: String(data.logo ?? data.profileImage ?? ''),
    categories,
    isDefault: Boolean(data.isDefault ?? false),
    isActive: Boolean(data.isActive ?? true),
    approvalStatus,
    ownerUid: data.ownerUid ? String(data.ownerUid) : null,
    approvedAt: data.approvedAt ? toDate(data.approvedAt) : undefined,
    rejectedAt: data.rejectedAt ? toDate(data.rejectedAt) : undefined,
    rejectionReason: data.rejectionReason
      ? String(data.rejectionReason)
      : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function buildDefaultSupplier(): Omit<Supplier, 'createdAt' | 'updatedAt'> {
  return {
    id: DEFAULT_SUPPLIER_ID,
    name: 'ShiQueen',
    companyName: 'ShiQueen',
    contactName: 'ShiQueen Team',
    email: 'hello@shequeen.com',
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
  const db = getFirebaseDb();
  if (!db) return 0;

  const snapshot = await getDocs(collection(db, COLLECTIONS.suppliers));
  let batch = writeBatch(db);
  let ops = 0;
  let updated = 0;

  for (const docSnap of snapshot.docs) {
    if (docSnap.data().approvalStatus != null) continue;
    batch.update(docSnap.ref, {
      approvalStatus: 'approved',
      ownerUid: docSnap.data().ownerUid ?? null,
      updatedAt: serverTimestamp(),
    });
    ops += 1;
    updated += 1;
    if (ops >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  return updated;
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
    '@/lib/firebase/users'
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
      await backfillSupplierApprovalStatus();
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
