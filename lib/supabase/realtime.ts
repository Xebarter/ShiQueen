import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

export type Unsubscribe = () => void;

export function subscribeTable<T>(
  table: string,
  fetchFn: () => Promise<T>,
  onData: (data: T) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const supabase = getSupabaseClient();
  if (!supabase) {
    void fetchFn().then(onData).catch((error) => onError?.(error as Error));
    return () => {};
  }

  let channel: RealtimeChannel | null = null;
  let active = true;

  const refresh = () => {
    if (!active) return;
    void fetchFn()
      .then((data) => {
        if (active) onData(data);
      })
      .catch((error) => onError?.(error as Error));
  };

  refresh();

  channel = supabase
    .channel(`realtime:${table}:${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, refresh)
    .subscribe();

  return () => {
    active = false;
    if (channel) void supabase.removeChannel(channel);
  };
}
