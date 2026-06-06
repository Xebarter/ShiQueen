import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { isFirestoreOfflineError } from '@/lib/firebase/errors';
import { SEED_PACKAGES, SEED_PRODUCTS } from '@/lib/firebase/seed-data';

let seedPromise: Promise<void> | null = null;

async function runSeed(): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const settingsRef = doc(db, COLLECTIONS.settings, 'app');
  const settingsSnap = await getDoc(settingsRef);

  if (settingsSnap.exists() && settingsSnap.data()?.seeded) {
    return;
  }

  const productsSnap = await getDocs(collection(db, COLLECTIONS.products));
  const batch = writeBatch(db);
  const timestamp = serverTimestamp();

  if (productsSnap.empty) {
    for (const product of SEED_PRODUCTS) {
      const { id, ...data } = product;
      batch.set(doc(db, COLLECTIONS.products, id), {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }

  const packagesSnap = await getDocs(collection(db, COLLECTIONS.packages));
  if (packagesSnap.empty) {
    for (const pkg of SEED_PACKAGES) {
      const { id, ...data } = pkg;
      batch.set(doc(db, COLLECTIONS.packages, id), {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }

  batch.set(
    settingsRef,
    {
      seeded: true,
      seededAt: timestamp,
      version: 1,
    },
    { merge: true }
  );

  await batch.commit();
}

export async function ensureDatabaseSeeded(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = runSeed().catch((error) => {
    seedPromise = null;

    if (isFirestoreOfflineError(error)) {
      console.warn('[SheQueen] Firestore offline — skipping database seed.');
      return;
    }

    console.error('[SheQueen] Database seed failed:', error);
  });

  return seedPromise;
}
