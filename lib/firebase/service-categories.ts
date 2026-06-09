import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';
import type { ServiceCategory } from '@/lib/types/services';

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function mapCategory(id: string, data: Record<string, unknown>): ServiceCategory {
  return {
    id,
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    serviceTypes: Array.isArray(data.serviceTypes) ? (data.serviceTypes as string[]) : [],
    sortOrder: Number(data.sortOrder ?? 0),
    isActive: Boolean(data.isActive ?? true),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function subscribeServiceCategories(
  onData: (categories: ServiceCategory[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.serviceCategories), orderBy('sortOrder', 'asc')),
    (snap) => {
      onData(snap.docs.map((d) => mapCategory(d.id, d.data())));
    },
    (err) => onError?.(err)
  );
}

export async function getServiceCategory(id: string): Promise<ServiceCategory | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.serviceCategories, id));
  if (!snap.exists()) return null;
  return mapCategory(snap.id, snap.data());
}

export async function createServiceCategory(
  category: Omit<ServiceCategory, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  const { id, ...data } = category;
  await setDoc(doc(db, COLLECTIONS.serviceCategories, id), {
    ...stripUndefined(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateServiceCategory(
  id: string,
  data: Partial<Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await setDoc(
    doc(db, COLLECTIONS.serviceCategories, id),
    { ...stripUndefined(data), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function deleteServiceCategory(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, COLLECTIONS.serviceCategories, id));
}
