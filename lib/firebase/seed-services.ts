import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { isFirestoreOfflineError } from '@/lib/firebase/errors';
import {
  SEED_PROVIDER_AVAILABILITY,
  SEED_SERVICE_CATEGORIES,
  SEED_SERVICE_LISTINGS,
  SEED_SERVICE_PROVIDERS,
} from '@/lib/firebase/seed-services-data';
import { ensureSuppliersReady } from '@/lib/firebase/suppliers';

let servicesSeedPromise: Promise<void> | null = null;

export async function ensureServicesSeeded(): Promise<void> {
  if (servicesSeedPromise) return servicesSeedPromise;

  servicesSeedPromise = (async () => {
    const db = getFirebaseDb();
    if (!db) return;

    await ensureSuppliersReady();

    const categoriesSnap = await getDocs(collection(db, COLLECTIONS.serviceCategories));
    if (!categoriesSnap.empty) return;

    const batch = writeBatch(db);
    const ts = serverTimestamp();

    for (const category of SEED_SERVICE_CATEGORIES) {
      batch.set(doc(db, COLLECTIONS.serviceCategories, category.id), {
        ...category,
        createdAt: ts,
        updatedAt: ts,
      });
    }

    for (const provider of SEED_SERVICE_PROVIDERS) {
      const { id, ...data } = provider;
      batch.set(doc(db, COLLECTIONS.serviceProviders, id), {
        ...data,
        createdAt: ts,
        updatedAt: ts,
      });
    }

    for (const listing of SEED_SERVICE_LISTINGS) {
      const { id, ...data } = listing;
      batch.set(doc(db, COLLECTIONS.services, id), {
        ...data,
        createdAt: ts,
        updatedAt: ts,
      });
    }

    for (const avail of SEED_PROVIDER_AVAILABILITY) {
      batch.set(doc(db, COLLECTIONS.providerAvailability, avail.id), {
        ...avail,
        updatedAt: ts,
      });
    }

    await batch.commit();
  })().catch((error) => {
    servicesSeedPromise = null;
    if (isFirestoreOfflineError(error)) {
      console.warn('[ShiQueen] Firestore offline — skipping services seed.');
      return;
    }
    console.error('[ShiQueen] Services seed failed:', error);
  });

  return servicesSeedPromise;
}
