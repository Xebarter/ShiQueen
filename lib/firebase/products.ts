import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';
import { Product } from '@/lib/types/database';
import { DEFAULT_SUPPLIER_ID } from '@/lib/types/suppliers';

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function sanitizeUpdateData(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === undefined ? deleteField() : value,
    ])
  );
}

function mapProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: String(data.name ?? ''),
    sku: String(data.sku ?? ''),
    description: String(data.description ?? ''),
    category: String(data.category ?? ''),
    supplierId: String(data.supplierId ?? DEFAULT_SUPPLIER_ID),
    price: Number(data.price ?? 0),
    originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
    stock: Number(data.stock ?? 0),
    rating: Number(data.rating ?? 0),
    reviews: Number(data.reviews ?? 0),
    image: String(data.image ?? ''),
    images: Array.isArray(data.images) ? (data.images as string[]) : [],
    sizes: Array.isArray(data.sizes) ? (data.sizes as string[]) : [],
    colors: Array.isArray(data.colors) ? (data.colors as string[]) : [],
    details: Array.isArray(data.details) ? (data.details as string[]) : [],
    isWholesaleEnabled: Boolean(data.isWholesaleEnabled ?? true),
    minOrderQuantity: Number(data.minOrderQuantity ?? 10),
    maxOrderQuantity:
      data.maxOrderQuantity === null || data.maxOrderQuantity === undefined
        ? null
        : Number(data.maxOrderQuantity),
    status: (data.status as Product['status']) ?? 'Active',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getProducts(): Promise<Product[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  const snapshot = await getDocs(query(collection(db, COLLECTIONS.products), orderBy('name')));
  return snapshot.docs.map((docSnap) => mapProduct(docSnap.id, docSnap.data()));
}

export async function getProduct(id: string): Promise<Product | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const snap = await getDoc(doc(db, COLLECTIONS.products, id));
  if (!snap.exists()) return null;
  return mapProduct(snap.id, snap.data());
}

export function subscribeProducts(
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.products), orderBy('name')),
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => mapProduct(docSnap.id, docSnap.data())));
    },
    (error) => onError?.(error)
  );
}

export async function createProduct(
  product: Omit<Product, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  const { id, ...data } = product;
  await setDoc(doc(db, COLLECTIONS.products, id), {
    ...stripUndefined(data as Record<string, unknown>),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function generateProductId(): string {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  return doc(collection(db, COLLECTIONS.products)).id;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  const { id: _id, createdAt, updatedAt, ...data } = updates;
  const ref = doc(db, COLLECTIONS.products, id);
  const payload = {
    ...sanitizeUpdateData(data as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  };

  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, payload);
    return;
  }

  await setDoc(ref, {
    ...stripUndefined(data as Record<string, unknown>),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, COLLECTIONS.products, id));
}
