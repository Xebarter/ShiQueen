import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';
import { isFirestoreOfflineError } from '@/lib/firebase/errors';
import { UserProfile, UserRole, UserNotificationPreferences, UserSavedAddress } from '@/lib/types/database';
import { DEFAULT_USER_PREFERENCES } from '@/lib/account-settings';

function getAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function resolveUserRole(email: string): UserRole {
  return getAdminEmails().includes(email.toLowerCase()) ? 'admin' : 'customer';
}

function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

function mapPreferences(raw: unknown): UserNotificationPreferences | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const data = raw as Record<string, unknown>;
  return {
    orderUpdates:
      typeof data.orderUpdates === 'boolean'
        ? data.orderUpdates
        : DEFAULT_USER_PREFERENCES.orderUpdates,
    promotions:
      typeof data.promotions === 'boolean'
        ? data.promotions
        : DEFAULT_USER_PREFERENCES.promotions,
    serviceReminders:
      typeof data.serviceReminders === 'boolean'
        ? data.serviceReminders
        : DEFAULT_USER_PREFERENCES.serviceReminders,
    smsAlerts:
      typeof data.smsAlerts === 'boolean'
        ? data.smsAlerts
        : DEFAULT_USER_PREFERENCES.smsAlerts,
    pushAlerts:
      typeof data.pushAlerts === 'boolean'
        ? data.pushAlerts
        : DEFAULT_USER_PREFERENCES.pushAlerts,
  };
}

function mapSavedAddress(raw: unknown): UserSavedAddress | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const data = raw as Record<string, unknown>;
  const fullName = String(data.fullName ?? '').trim();
  const phone = String(data.phone ?? '').trim();
  const address = String(data.address ?? '').trim();
  const city = String(data.city ?? '').trim();
  if (!fullName && !phone && !address && !city) return undefined;
  return {
    fullName,
    phone,
    address,
    city: city || 'Kampala',
    district: data.district ? String(data.district) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
  };
}

function buildOfflineProfile(
  uid: string,
  email: string,
  displayName?: string,
  extras?: Pick<UserProfile, 'role' | 'supplierId' | 'providerId'>
): UserProfile {
  return {
    uid,
    email,
    displayName,
    role: extras?.role ?? resolveUserRole(email),
    supplierId: extras?.supplierId,
    providerId: extras?.providerId,
    preferences: { ...DEFAULT_USER_PREFERENCES },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function mapUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    email: String(data.email ?? ''),
    displayName: data.displayName ? String(data.displayName) : undefined,
    phone: data.phone ? String(data.phone) : undefined,
    photoURL: data.photoURL ? String(data.photoURL) : undefined,
    role: (data.role as UserRole) ?? 'customer',
    supplierId: data.supplierId ? String(data.supplierId) : undefined,
    providerId: data.providerId ? String(data.providerId) : undefined,
    preferences: mapPreferences(data.preferences),
    defaultAddress: mapSavedAddress(data.defaultAddress),
    fcmTokens: Array.isArray(data.fcmTokens)
      ? data.fcmTokens.map(String).filter(Boolean)
      : [],
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!snap.exists()) return null;
  return mapUserProfile(snap.id, snap.data());
}

export async function createUserProfile(
  uid: string,
  email: string,
  displayName?: string,
  options?: { role?: UserRole; supplierId?: string; providerId?: string }
): Promise<UserProfile> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  const role = isAdminEmail(email) ? 'admin' : options?.role ?? resolveUserRole(email);

  const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
    uid,
    email,
    displayName,
    role,
    supplierId: options?.supplierId,
    providerId: options?.providerId,
  };

  await setDoc(doc(db, COLLECTIONS.users, uid), {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName ?? null,
    role: profile.role,
    supplierId: profile.supplierId ?? null,
    providerId: profile.providerId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    ...profile,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Sync profile on login. Admin emails always become admin.
 * Existing supplier (and admin) roles are preserved when not an admin email.
 */
export async function ensureUserProfile(
  uid: string,
  email: string,
  displayName?: string
): Promise<UserProfile> {
  try {
    const existing = await getUserProfile(uid);

    if (existing) {
      if (isAdminEmail(email) && existing.role !== 'admin') {
        try {
          await updateUserRole(uid, 'admin');
          return { ...existing, role: 'admin', updatedAt: new Date() };
        } catch (error) {
          if (isFirestoreOfflineError(error)) {
            return { ...existing, role: 'admin', updatedAt: new Date() };
          }
          throw error;
        }
      }
      return existing;
    }

    return createUserProfile(uid, email, displayName);
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      console.warn('[ShiQueen] Firestore offline — using local profile for', email);
      return buildOfflineProfile(uid, email, displayName);
    }
    throw error;
  }
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  await updateDoc(doc(db, COLLECTIONS.users, uid), {
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function isUserAdmin(uid: string): Promise<boolean> {
  const profile = await getUserProfile(uid);
  return profile?.role === 'admin';
}

export function subscribeUsers(
  onData: (users: UserProfile[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    collection(db, COLLECTIONS.users),
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => mapUserProfile(docSnap.id, docSnap.data())));
    },
    (error) => onError?.(error)
  );
}

export function generateUserId(): string {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  return doc(collection(db, COLLECTIONS.users)).id;
}

export async function createCustomerProfile(data: {
  email: string;
  displayName?: string;
}): Promise<UserProfile> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  const uid = generateUserId();
  const email = data.email.trim().toLowerCase();
  const displayName = data.displayName?.trim() || undefined;

  const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
    uid,
    email,
    displayName,
    role: 'customer',
  };

  await setDoc(doc(db, COLLECTIONS.users, uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { ...profile, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<
    Pick<
      UserProfile,
      | 'displayName'
      | 'email'
      | 'phone'
      | 'photoURL'
      | 'role'
      | 'supplierId'
      | 'providerId'
      | 'preferences'
      | 'defaultAddress'
    >
  >
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.displayName !== undefined) {
    payload.displayName = updates.displayName.trim() || null;
  }
  if (updates.email !== undefined) {
    payload.email = updates.email.trim().toLowerCase();
  }
  if (updates.phone !== undefined) {
    payload.phone = updates.phone.trim() || null;
  }
  if (updates.photoURL !== undefined) {
    payload.photoURL = updates.photoURL.trim() || null;
  }
  if (updates.role !== undefined) {
    payload.role = updates.role;
  }
  if (updates.supplierId !== undefined) {
    payload.supplierId = updates.supplierId || null;
  }
  if (updates.providerId !== undefined) {
    payload.providerId = updates.providerId || null;
  }
  if (updates.preferences !== undefined) {
    payload.preferences = updates.preferences;
  }
  if (updates.defaultAddress !== undefined) {
    const address = updates.defaultAddress;
    payload.defaultAddress = address
      ? {
          fullName: address.fullName.trim(),
          phone: address.phone.trim(),
          address: address.address.trim(),
          city: address.city.trim() || 'Kampala',
          district: address.district?.trim() || null,
          notes: address.notes?.trim() || null,
        }
      : null;
  }

  await updateDoc(
    doc(db, COLLECTIONS.users, uid),
    payload as Record<string, import('firebase/firestore').FieldValue | string | null | object>
  );
}

export async function addUserFcmToken(uid: string, token: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !token) return;
  await updateDoc(doc(db, COLLECTIONS.users, uid), {
    fcmTokens: arrayUnion(token),
    updatedAt: serverTimestamp(),
  });
}

export async function removeUserFcmToken(uid: string, token: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !token) return;
  await updateDoc(doc(db, COLLECTIONS.users, uid), {
    fcmTokens: arrayRemove(token),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUserProfile(uid: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(db, COLLECTIONS.users, uid));
}
