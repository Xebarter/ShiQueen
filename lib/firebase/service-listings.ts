import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';
import type { ServiceListing } from '@/lib/types/services';
import { DEFAULT_SUPPLIER_ID } from '@/lib/types/suppliers';

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function mapListing(id: string, data: Record<string, unknown>): ServiceListing {
  return {
    id,
    slug: String(data.slug ?? id),
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    benefits: Array.isArray(data.benefits) ? (data.benefits as string[]) : [],
    categoryId: String(data.categoryId ?? ''),
    serviceType: String(data.serviceType ?? ''),
    providerId: String(data.providerId ?? ''),
    supplierId: String(data.supplierId ?? DEFAULT_SUPPLIER_ID),
    durationMinutes: Number(data.durationMinutes ?? 60),
    basePrice: Number(data.basePrice ?? 0),
    galleryImages: Array.isArray(data.galleryImages) ? (data.galleryImages as string[]) : [],
    isFeatured: Boolean(data.isFeatured ?? false),
    isPopular: Boolean(data.isPopular ?? false),
    isActive: Boolean(data.isActive ?? true),
    isArchived: Boolean(data.isArchived ?? false),
    supportsMobile: Boolean(data.supportsMobile ?? false),
    supportsInStudio: Boolean(data.supportsInStudio ?? true),
    location: String(data.location ?? ''),
    bookingCount: Number(data.bookingCount ?? 0),
    viewCount: Number(data.viewCount ?? 0),
    rating: Number(data.rating ?? 0),
    reviewCount: Number(data.reviewCount ?? 0),
    sortOrder: Number(data.sortOrder ?? 0),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function subscribeServiceListings(
  onData: (listings: ServiceListing[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.services), orderBy('sortOrder', 'asc')),
    (snap) => {
      onData(snap.docs.map((d) => mapListing(d.id, d.data())));
    },
    (err) => onError?.(err)
  );
}

export async function getServiceListing(id: string): Promise<ServiceListing | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.services, id));
  if (!snap.exists()) return null;
  return mapListing(snap.id, snap.data());
}

export async function getServiceListingBySlug(slug: string): Promise<ServiceListing | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.services), where('slug', '==', slug))
  );
  if (snap.empty) return null;
  const docSnap = snap.docs[0]!;
  return mapListing(docSnap.id, docSnap.data());
}

export async function createServiceListing(
  listing: Omit<ServiceListing, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  const { id, ...data } = listing;
  await setDoc(doc(db, COLLECTIONS.services, id), {
    ...stripUndefined(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateServiceListing(
  id: string,
  data: Partial<Omit<ServiceListing, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await setDoc(
    doc(db, COLLECTIONS.services, id),
    { ...stripUndefined(data), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function deleteServiceListing(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, COLLECTIONS.services, id));
}

export async function incrementServiceViewCount(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.services, id), {
      viewCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // non-blocking
  }
}

export async function incrementServiceBookingCount(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.services, id), {
      bookingCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // non-blocking
  }
}
