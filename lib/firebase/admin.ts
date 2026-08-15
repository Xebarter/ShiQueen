export {
  getFcmAdminApp as getAdminApp,
  isFcmAdminConfigured,
  isFirebaseAdminConfigured,
} from '@/lib/fcm/admin';

/** @deprecated Firestore Admin removed — use getSupabaseAdmin(). */
export async function getAdminDb(): Promise<never> {
  throw new Error('Firestore Admin removed. Use getSupabaseAdmin() from @/lib/supabase/admin.');
}
