import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  enableNetwork,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let firestoreInstance: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined' || !isFirebaseConfigured()) {
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;

  if (!firestoreInstance) {
    try {
      firestoreInstance = initializeFirestore(app, {
        // Helps in dev / restrictive networks where WebChannel is blocked
        experimentalForceLongPolling: process.env.NODE_ENV === 'development',
      });
    } catch {
      firestoreInstance = getFirestore(app);
    }

    void enableNetwork(firestoreInstance).catch((error) => {
      console.warn('[SheQueen] Firestore network enable failed:', error);
    });
  }

  return firestoreInstance;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  return app ? getStorage(app) : null;
}

/** @deprecated Use getFirebaseAuth() */
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : null;

/** @deprecated Use getFirebaseDb() */
export const db = typeof window !== 'undefined' ? getFirebaseDb() : null;

/** @deprecated Use getFirebaseStorage() */
export const storage = typeof window !== 'undefined' ? getFirebaseStorage() : null;

export default getFirebaseApp();
