export { getSupabaseClient } from '@/lib/supabase/client';
export { getSupabaseServerClient } from '@/lib/supabase/server';
export { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
export {
  isSupabaseConfigured,
  isSupabaseAdminConfigured as isBackendConfigured,
} from '@/lib/supabase/config';
