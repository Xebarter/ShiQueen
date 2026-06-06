import { FirebaseError } from 'firebase/app';

export function isFirestoreOfflineError(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error && error.message.toLowerCase().includes('offline');
  }

  return (
    error.code === 'unavailable' ||
    error.message.toLowerCase().includes('offline') ||
    error.message.toLowerCase().includes('client is offline')
  );
}
