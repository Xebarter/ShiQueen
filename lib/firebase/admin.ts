import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import type { Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

function parseServiceAccount(): Record<string, string> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }
}

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0]!;
    return adminApp;
  }

  const serviceAccount = parseServiceAccount();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (serviceAccount) {
    adminApp = initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      projectId: serviceAccount.project_id ?? projectId,
    });
    return adminApp;
  }

  if (!projectId) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON for payment webhooks.'
    );
  }

  adminApp = initializeApp({ projectId });
  return adminApp;
}

export async function getAdminDb(): Promise<Firestore> {
  if (!adminDb) {
    const { getFirestore } = await import('firebase-admin/firestore');
    adminDb = getFirestore(getAdminApp());
  }
  return adminDb;
}

export { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
