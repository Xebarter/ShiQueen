import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';
import type { ProviderApprovalStatus, ServiceProvider } from '@/lib/types/services';

export type ProviderCatalogCounts = {
  listings: number;
  activeListings: number;
};

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function mapProvider(id: string, data: Record<string, unknown>): ServiceProvider {
  const isActive = Boolean(data.isActive ?? true);
  const rawStatus = data.approvalStatus;
  const approvalStatus: ProviderApprovalStatus =
    rawStatus === 'pending' ||
    rawStatus === 'approved' ||
    rawStatus === 'rejected' ||
    rawStatus === 'suspended'
      ? rawStatus
      : isActive
        ? 'approved'
        : 'pending';

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
    isActive,
    ownerUid: data.ownerUid ? String(data.ownerUid) : null,
    approvalStatus,
    approvedAt: data.approvedAt ? toDate(data.approvedAt) : undefined,
    rejectedAt: data.rejectedAt ? toDate(data.rejectedAt) : undefined,
    rejectionReason: data.rejectionReason ? String(data.rejectionReason) : undefined,
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

export function generateServiceProviderId(): string {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  return doc(collection(db, COLLECTIONS.serviceProviders)).id;
}

export async function getServiceProvider(id: string): Promise<ServiceProvider | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.serviceProviders, id));
  if (!snap.exists()) return null;
  return mapProvider(snap.id, snap.data());
}

export async function getProviderListingCounts(
  providerId: string
): Promise<ProviderCatalogCounts> {
  const db = getFirebaseDb();
  if (!db) return { listings: 0, activeListings: 0 };
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.services), where('providerId', '==', providerId))
  );
  let activeListings = 0;
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.isActive && !data.isArchived) activeListings += 1;
  });
  return { listings: snap.size, activeListings };
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

  const listingSnap = await getDocs(
    query(collection(db, COLLECTIONS.services), where('providerId', '==', id))
  );

  const batch = writeBatch(db);
  listingSnap.docs.forEach((listingDoc) => {
    batch.update(listingDoc.ref, {
      isActive: false,
      isArchived: true,
      updatedAt: serverTimestamp(),
    });
  });
  batch.delete(doc(db, COLLECTIONS.providerAvailability, id));
  batch.delete(doc(db, COLLECTIONS.serviceProviders, id));
  await batch.commit();
}

export async function setProviderApprovalStatus(
  id: string,
  approvalStatus: ProviderApprovalStatus,
  options?: { rejectionReason?: string }
): Promise<void> {
  const patch: Partial<Omit<ServiceProvider, 'id' | 'createdAt' | 'updatedAt'>> = {
    approvalStatus,
  };

  if (approvalStatus === 'approved') {
    patch.isActive = true;
    patch.isVerified = true;
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

  await updateServiceProvider(id, patch);
}

export type ProviderRegistrationInput = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  city: string;
  bio?: string;
  categoryIds: string[];
  mobileServiceEnabled?: boolean;
  serviceAreas?: string[];
};

/** Create a pending provider owned by the given auth user and link the user profile. */
export async function linkProviderRegistration(
  uid: string,
  input: ProviderRegistrationInput
): Promise<{ providerId: string }> {
  const { upsertProviderAvailability } = await import(
    '@/lib/firebase/provider-availability'
  );
  const { getDefaultWeeklySlots } = await import('@/lib/services-utils');

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const businessName = input.businessName.trim();
  const phone = input.phone.trim();
  const city = input.city.trim() || 'Kampala';
  const providerId = generateServiceProviderId();

  await createServiceProvider({
    id: providerId,
    name,
    businessName,
    phone,
    whatsapp: (input.whatsapp || phone).trim(),
    email,
    address: (input.address || '').trim(),
    city,
    profileImage: '',
    bio: (input.bio || '').trim(),
    experienceYears: 0,
    categoryIds: input.categoryIds,
    portfolioImages: [],
    isVerified: false,
    isActive: false,
    ownerUid: uid,
    approvalStatus: 'pending',
    mobileServiceEnabled: Boolean(input.mobileServiceEnabled),
    serviceRadiusKm: input.mobileServiceEnabled ? 15 : 0,
    serviceAreas: input.serviceAreas?.length ? input.serviceAreas : [city],
    travelFee: 0,
    rating: 0,
    reviewCount: 0,
    completedJobs: 0,
  });

  await upsertProviderAvailability({
    id: providerId,
    providerId,
    weeklySlots: getDefaultWeeklySlots(),
    blackoutDates: [],
    slotDurationMinutes: 60,
  });

  const { createUserProfile, getUserProfile, updateUserProfile } = await import(
    '@/lib/firebase/users'
  );

  const existing = await getUserProfile(uid);
  const nextRole =
    existing?.role === 'admin' || existing?.role === 'supplier'
      ? existing.role
      : 'service_provider';

  if (existing) {
    await updateUserProfile(uid, {
      role: nextRole,
      providerId,
      displayName: name,
      phone,
    });
  } else {
    await createUserProfile(uid, email, name, {
      role: 'service_provider',
      providerId,
    });
  }

  return { providerId };
}
