export function isSupabaseOfflineError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = String((error as { message?: string }).message ?? '').toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('failed to fetch')
  );
}

/** @deprecated Use isSupabaseOfflineError */
export const isFirestoreOfflineError = isSupabaseOfflineError;
