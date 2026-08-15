export {
  getFirebaseApp,
  getFirebaseAuth,
  isFirebaseAuthConfigured,
  isFirebaseAuthConfigured as isFirebaseConfigured,
} from '@/lib/firebase/auth';

export { isSupabaseConfigured } from '@/lib/supabase/config';

/** @deprecated Firestore removed — use getSupabaseClient(). */
export function getFirebaseDb(): null {
  return null;
}

/** @deprecated Firebase Storage removed — use Supabase Storage via API routes. */
export function getFirebaseStorage(): null {
  return null;
}
