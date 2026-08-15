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
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const refresh = () => {
    if (!active) return;
    void fetchFn()
      .then((data) => {
        if (active) onData(data);
      })
      .catch((error) => onError?.(error as Error));
  };

  const scheduleRefresh = () => {
    if (!active) return;
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      refresh();
    }, 150);
  };

  const removeChannel = () => {
    if (!channel) return;
    const current = channel;
    channel = null;
    void supabase.removeChannel(current);
  };

  const connect = () => {
    if (!active) return;
    removeChannel();

    channel = supabase
      .channel(`realtime:${table}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRefresh)
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          scheduleRefresh();
          return;
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, 1500);
        }
      });
  };

  refresh();
  connect();

  const onVisibility = () => {
    if (document.visibilityState === 'visible') scheduleRefresh();
  };

  const onOnline = () => {
    scheduleRefresh();
    connect();
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', scheduleRefresh);
  window.addEventListener('online', onOnline);

  return () => {
    active = false;
    if (refreshTimer) clearTimeout(refreshTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    removeChannel();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('focus', scheduleRefresh);
    window.removeEventListener('online', onOnline);
  };
}
