import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';
import type { ServiceBooking, ServiceBookingStatus } from '@/lib/types/services';

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function mapBooking(id: string, data: Record<string, unknown>): ServiceBooking {
  return {
    id,
    serviceId: String(data.serviceId ?? ''),
    providerId: String(data.providerId ?? ''),
    userId: data.userId ? String(data.userId) : null,
    customerName: String(data.customerName ?? ''),
    customerPhone: String(data.customerPhone ?? ''),
    customerEmail: data.customerEmail ? String(data.customerEmail) : undefined,
    date: String(data.date ?? ''),
    timeSlot: String(data.timeSlot ?? ''),
    locationType: (data.locationType as ServiceBooking['locationType']) ?? 'studio',
    customerAddress: data.customerAddress ? String(data.customerAddress) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
    status: (data.status as ServiceBookingStatus) ?? 'pending',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function subscribeServiceBookings(
  onData: (bookings: ServiceBooking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.serviceBookings), orderBy('createdAt', 'desc')),
    (snap) => {
      onData(snap.docs.map((d) => mapBooking(d.id, d.data())));
    },
    (err) => onError?.(err)
  );
}

export async function createServiceBooking(
  booking: Omit<ServiceBooking, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  const { id, ...data } = booking;
  await setDoc(doc(db, COLLECTIONS.serviceBookings, id), {
    ...stripUndefined(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateServiceBookingStatus(
  id: string,
  status: ServiceBookingStatus
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await setDoc(
    doc(db, COLLECTIONS.serviceBookings, id),
    { status, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function updateServiceBooking(
  id: string,
  data: Partial<Omit<ServiceBooking, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await setDoc(
    doc(db, COLLECTIONS.serviceBookings, id),
    { ...stripUndefined(data), updatedAt: serverTimestamp() },
    { merge: true }
  );
}
