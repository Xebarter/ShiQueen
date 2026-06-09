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
import type { ServiceProvider } from '@/lib/types/services';

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function mapProvider(id: string, data: Record<string, unknown>): ServiceProvider {
  return {
    id,
    name: String(data.name ?? ''),
    businessName: String(data.businessName ?? ''),
    phone: String(data.phone ?? ''),
    whatsapp: String(data.whatsapp ?? data.phone ?? ''),
    email: String(data.email ?? ''),
    address: String(data.address ?? ''),
    city: String(data.city ?? 'Kampala'),
    profileImage: String(data.profileImage ?? ''),
    bio: String(data.bio ?? ''),
    experienceYears: Number(data.experienceYears ?? 0),
    categoryIds: Array.isArray(data.categoryIds) ? (data.categoryIds as string[]) : [],
    portfolioImages: Array.isArray(data.portfolioImages) ? (data.portfolioImages as string[]) : [],
    isVerified: Boolean(data.isVerified ?? false),
    isActive: Boolean(data.isActive ?? true),
    mobileServiceEnabled: Boolean(data.mobileServiceEnabled ?? false),
    serviceRadiusKm: Number(data.serviceRadiusKm ?? 0),
    serviceAreas: Array.isArray(data.serviceAreas) ? (data.serviceAreas as string[]) : [],
    travelFee: Number(data.travelFee ?? 0),
    rating: Number(data.rating ?? 0),
    reviewCount: Number(data.reviewCount ?? 0),
    completedJobs: Number(data.completedJobs ?? 0),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function subscribeServiceProviders(
  onData: (providers: ServiceProvider[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.serviceProviders), orderBy('createdAt', 'desc')),
    (snap) => {
      onData(snap.docs.map((d) => mapProvider(d.id, d.data())));
    },
    (err) => onError?.(err)
  );
}

export async function getServiceProvider(id: string): Promise<ServiceProvider | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.serviceProviders, id));
  if (!snap.exists()) return null;
  return mapProvider(snap.id, snap.data());
}

export async function createServiceProvider(
  provider: Omit<ServiceProvider, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  const { id, ...data } = provider;
  await setDoc(doc(db, COLLECTIONS.serviceProviders, id), {
    ...stripUndefined(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateServiceProvider(
  id: string,
  data: Partial<Omit<ServiceProvider, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await setDoc(
    doc(db, COLLECTIONS.serviceProviders, id),
    { ...stripUndefined(data), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function deleteServiceProvider(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, COLLECTIONS.serviceProviders, id));
}
