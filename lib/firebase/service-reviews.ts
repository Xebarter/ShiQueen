import {
  collection,
  doc,
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
import type { ServiceReview } from '@/lib/types/services';

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function mapReview(id: string, data: Record<string, unknown>): ServiceReview {
  return {
    id,
    serviceId: String(data.serviceId ?? ''),
    providerId: String(data.providerId ?? ''),
    bookingId: data.bookingId ? String(data.bookingId) : undefined,
    rating: Number(data.rating ?? 0),
    comment: String(data.comment ?? ''),
    customerName: String(data.customerName ?? ''),
    isVisible: Boolean(data.isVisible ?? true),
    createdAt: toDate(data.createdAt),
  };
}

export function subscribeServiceReviews(
  onData: (reviews: ServiceReview[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.serviceReviews), orderBy('createdAt', 'desc')),
    (snap) => {
      onData(snap.docs.map((d) => mapReview(d.id, d.data())));
    },
    (err) => onError?.(err)
  );
}

export async function createServiceReview(
  review: Omit<ServiceReview, 'createdAt'>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  const { id, ...data } = review;
  await setDoc(doc(db, COLLECTIONS.serviceReviews, id), {
    ...stripUndefined(data),
    createdAt: serverTimestamp(),
  });
}

export async function updateServiceReviewVisibility(
  id: string,
  isVisible: boolean
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await setDoc(doc(db, COLLECTIONS.serviceReviews, id), { isVisible }, { merge: true });
}

export async function deleteServiceReview(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, COLLECTIONS.serviceReviews, id));
}
