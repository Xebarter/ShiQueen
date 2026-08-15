import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';

let adminApp: App | null = null;

function parseServiceAccount(): Record<string, string> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }
}

/** Firebase Admin is retained only for FCM messaging. */
export function getFcmAdminApp(): App {
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
    throw new Error('FCM requires FIREBASE_SERVICE_ACCOUNT_JSON or NEXT_PUBLIC_FIREBASE_PROJECT_ID.');
  }

  adminApp = initializeApp({ projectId });
  return adminApp;
}

export function isFcmAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
  );
}

/** @deprecated Use isFcmAdminConfigured */
export const isFirebaseAdminConfigured = isFcmAdminConfigured;

/** @deprecated Use getFcmAdminApp */
export const getAdminApp = getFcmAdminApp;
