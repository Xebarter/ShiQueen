import {
  collection,
  deleteField,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { stripUndefined } from '@/lib/firebase/sanitize';
import { toDate } from '@/lib/firebase/timestamp';
import { Package, BulkOrder, WholesaleAccount } from '@/lib/types/wholesale';

function sanitizePackageUpdateData(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === undefined ? deleteField() : stripUndefined(value),
    ])
  );
}

function mapPackage(id: string, data: Record<string, unknown>): Package {
  return {
    id,
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    items: Array.isArray(data.items) ? data.items : [],
    rule: data.rule as Package['rule'],
    pricingMode: data.pricingMode === 'auto' ? 'auto' : 'custom',
    basePrice: Number(data.basePrice ?? 0),
    discountedPrice: Number(data.discountedPrice ?? 0),
    savingsPercentage: Number(data.savingsPercentage ?? 0),
    coverMode: data.coverMode === 'products' ? 'products' : data.coverMode === 'upload' ? 'upload' : undefined,
    image: data.image ? String(data.image) : undefined,
    coverProductIds: Array.isArray(data.coverProductIds)
      ? data.coverProductIds.map(String).slice(0, 4)
      : undefined,
    isActive: Boolean(data.isActive ?? true),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapBulkOrder(id: string, data: Record<string, unknown>): BulkOrder {
  return {
    id,
    customerId: String(data.customerId ?? ''),
    items: Array.isArray(data.items) ? data.items : [],
    totalAmount: Number(data.totalAmount ?? 0),
    orderType: (data.orderType as BulkOrder['orderType']) ?? 'wholesale',
    status: (data.status as BulkOrder['status']) ?? 'pending',
    notes: data.notes ? String(data.notes) : undefined,
    requestedAt: toDate(data.requestedAt),
    approvedAt: data.approvedAt ? toDate(data.approvedAt) : undefined,
    shippedAt: data.shippedAt ? toDate(data.shippedAt) : undefined,
  };
}

function mapWholesaleAccount(id: string, data: Record<string, unknown>): WholesaleAccount {
  return {
    id,
    customerId: String(data.customerId ?? ''),
    companyName: String(data.companyName ?? ''),
    taxId: data.taxId ? String(data.taxId) : undefined,
    status: (data.status as WholesaleAccount['status']) ?? 'pending',
    discount: data.discount ? Number(data.discount) : undefined,
    creditLimit: data.creditLimit ? Number(data.creditLimit) : undefined,
    createdAt: toDate(data.createdAt),
    approvedAt: data.approvedAt ? toDate(data.approvedAt) : undefined,
  };
}

export function subscribePackages(
  onData: (packages: Package[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.packages), orderBy('name')),
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => mapPackage(docSnap.id, docSnap.data())));
    },
    (error) => onError?.(error)
  );
}

export async function savePackage(
  pkg: Omit<Package, 'createdAt' | 'updatedAt'> & { createdAt?: Date; updatedAt?: Date }
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  const { id, createdAt, updatedAt, ...data } = pkg;
  const ref = doc(db, COLLECTIONS.packages, id);
  const existing = await getDoc(ref);
  const payload = data as Record<string, unknown>;

  if (existing.exists()) {
    await updateDoc(ref, {
      ...sanitizePackageUpdateData(payload),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      ...stripUndefined(payload),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function deletePackage(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, COLLECTIONS.packages, id));
}

export function subscribeBulkOrders(
  onData: (orders: BulkOrder[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.bulkOrders), orderBy('requestedAt', 'desc')),
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => mapBulkOrder(docSnap.id, docSnap.data())));
    },
    (error) => onError?.(error)
  );
}

export async function saveBulkOrder(order: BulkOrder): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  const { id, requestedAt, approvedAt, shippedAt, ...data } = order;
  await setDoc(doc(db, COLLECTIONS.bulkOrders, id), {
    ...data,
    requestedAt: requestedAt ?? serverTimestamp(),
    approvedAt: approvedAt ?? null,
    shippedAt: shippedAt ?? null,
  });
}

export async function updateBulkOrder(
  id: string,
  updates: Partial<BulkOrder>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  const { id: _id, requestedAt, approvedAt, shippedAt, ...data } = updates;
  await updateDoc(doc(db, COLLECTIONS.bulkOrders, id), {
    ...data,
    ...(approvedAt ? { approvedAt } : {}),
    ...(shippedAt ? { shippedAt } : {}),
  });
}

export function subscribeWholesaleAccounts(
  onData: (accounts: WholesaleAccount[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.wholesaleAccounts), orderBy('createdAt', 'desc')),
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => mapWholesaleAccount(docSnap.id, docSnap.data())));
    },
    (error) => onError?.(error)
  );
}

export async function saveWholesaleAccount(
  account: Omit<WholesaleAccount, 'createdAt'> & { createdAt?: Date }
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  const { id, createdAt, approvedAt, ...data } = account;
  await setDoc(doc(db, COLLECTIONS.wholesaleAccounts, id), {
    ...data,
    createdAt: createdAt ?? serverTimestamp(),
    approvedAt: approvedAt ?? null,
  });
}

export async function updateWholesaleAccountStatus(
  id: string,
  status: WholesaleAccount['status']
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  await updateDoc(doc(db, COLLECTIONS.wholesaleAccounts, id), {
    status,
    ...(status === 'approved' ? { approvedAt: serverTimestamp() } : {}),
  });
}
