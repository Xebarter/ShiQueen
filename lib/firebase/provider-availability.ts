import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';
import type { ProviderAvailability } from '@/lib/types/services';

function mapAvailability(id: string, data: Record<string, unknown>): ProviderAvailability {
  return {
    id,
    providerId: String(data.providerId ?? id),
    weeklySlots: (data.weeklySlots as ProviderAvailability['weeklySlots']) ?? {},
    blackoutDates: Array.isArray(data.blackoutDates) ? (data.blackoutDates as string[]) : [],
    slotDurationMinutes: Number(data.slotDurationMinutes ?? 60),
    updatedAt: toDate(data.updatedAt),
  };
}

export function subscribeProviderAvailability(
  onData: (items: ProviderAvailability[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.providerAvailability)),
    (snap) => {
      onData(snap.docs.map((d) => mapAvailability(d.id, d.data())));
    },
    (err) => onError?.(err)
  );
}

export async function getProviderAvailability(
  providerId: string
): Promise<ProviderAvailability | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.providerAvailability, providerId));
  if (!snap.exists()) return null;
  return mapAvailability(snap.id, snap.data());
}

export async function upsertProviderAvailability(
  availability: Omit<ProviderAvailability, 'updatedAt'>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  const { id, ...data } = availability;
  await setDoc(
    doc(db, COLLECTIONS.providerAvailability, id),
    { ...data, providerId: availability.providerId, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
