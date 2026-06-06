import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';
import { isFirestoreOfflineError } from '@/lib/firebase/errors';
import { UserProfile, UserRole } from '@/lib/types/database';

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

function buildOfflineProfile(
  uid: string,
  email: string,
  displayName?: string
): UserProfile {
  return {
    uid,
    email,
    displayName,
    role: resolveUserRole(email),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function mapUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    email: String(data.email ?? ''),
    displayName: data.displayName ? String(data.displayName) : undefined,
    role: (data.role as UserRole) ?? 'customer',
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
  displayName?: string
): Promise<UserProfile> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
    uid,
    email,
    displayName,
    role: resolveUserRole(email),
  };

  await setDoc(doc(db, COLLECTIONS.users, uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    ...profile,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function ensureUserProfile(
  uid: string,
  email: string,
  displayName?: string
): Promise<UserProfile> {
  const expectedRole = resolveUserRole(email);

  try {
    const existing = await getUserProfile(uid);

    if (existing) {
      if (existing.role !== expectedRole) {
        try {
          await updateUserRole(uid, expectedRole);
          return { ...existing, role: expectedRole, updatedAt: new Date() };
        } catch (error) {
          if (isFirestoreOfflineError(error)) {
            return { ...existing, role: expectedRole, updatedAt: new Date() };
          }
          throw error;
        }
      }
      return existing;
    }

    return createUserProfile(uid, email, displayName);
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      console.warn('[SheQueen] Firestore offline — using local profile for', email);
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
