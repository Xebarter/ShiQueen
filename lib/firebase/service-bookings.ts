import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';
import type { ServiceBooking, ServiceBookingStatus } from '@/lib/types/services';
import type { PaymentMethod, PaymentStatus } from '@/lib/types/database';

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
    amount: Number(data.amount ?? 0),
    travelFee: Number(data.travelFee ?? 0),
    total: Number(data.total ?? data.amount ?? 0),
    serviceName: String(data.serviceName ?? ''),
    providerName: String(data.providerName ?? ''),
    paymentMethod: data.paymentMethod as PaymentMethod | undefined,
    paymentStatus: data.paymentStatus as PaymentStatus | undefined,
    paytotaPurchaseId: data.paytotaPurchaseId ? String(data.paytotaPurchaseId) : undefined,
    paytotaReference: data.paytotaReference ? String(data.paytotaReference) : undefined,
    sharedBookingToken: data.sharedBookingToken
      ? String(data.sharedBookingToken)
      : undefined,
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

/** Public slot conflict query — only returns time slots, not customer PII. */
export async function getBookedTimeSlotsForProviderDate(
  providerId: string,
  date: string
): Promise<string[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.serviceBookings),
      where('providerId', '==', providerId),
      where('date', '==', date)
    )
  );

  return snap.docs
    .map((d) => mapBooking(d.id, d.data()))
    .filter((b) => {
      if (b.status === 'cancelled') return false;
      if (b.paymentStatus === 'failed' || b.paymentStatus === 'cancelled') return false;
      return (
        b.status === 'pending' ||
        b.status === 'confirmed' ||
        b.status === 'in_progress' ||
        b.paymentStatus === 'awaiting_payment' ||
        b.paymentStatus === 'paid'
      );
    })
    .map((b) => b.timeSlot)
    .filter(Boolean);
}

export async function createServiceBooking(
  booking: Omit<ServiceBooking, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  const { id, ...data } = booking;
  await setDoc(doc(db, COLLECTIONS.serviceBookings, id), {
    ...stripUndefined(data as Record<string, unknown>),
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
    { ...stripUndefined(data as Record<string, unknown>), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getServiceBookingById(id: string): Promise<ServiceBooking | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, COLLECTIONS.serviceBookings, id));
  if (!snap.exists()) return null;
  return mapBooking(snap.id, snap.data());
}
