import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from '@/lib/supabase/config';

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined' || !isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      accessToken: async () => {
        const auth = getFirebaseAuth();
        const currentUser = auth?.currentUser;
        if (!currentUser) return null;
        return currentUser.getIdToken(false);
      },
    });
  }

  return browserClient;
}

/** Reset client after sign-out so the next session picks up fresh tokens. */
export function resetSupabaseClient(): void {
  browserClient = null;
}
