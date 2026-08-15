import { getSupabaseClient } from '@/lib/supabase/client';
import { generateId } from '@/lib/supabase/ids';
import { type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate, toIso } from '@/lib/supabase/timestamp';
import { MarketingAd, MarketingAdPlacement } from '@/lib/types/database';

/** Stored under settings (public read) so ads work without a separate rules deploy. */
const MARKETING_SETTINGS_KEY = 'marketing';

function mapMarketingAd(id: string, data: Record<string, unknown>): MarketingAd {
  return {
    id,
    placement: (data.placement as MarketingAdPlacement) ?? 'home-hero',
    productId: String(data.productId ?? ''),
    bannerImage: String(data.bannerImage ?? ''),
    headline: String(data.headline ?? ''),
    subheadline: String(data.subheadline ?? ''),
    ctaLabel: String(data.ctaLabel ?? 'Shop Now'),
    badgeText: String(data.badgeText ?? 'Featured'),
    isActive: Boolean(data.isActive ?? false),
    priority: Number(data.priority ?? 0),
    startsAt: data.startsAt ? toDate(data.startsAt) : null,
    endsAt: data.endsAt ? toDate(data.endsAt) : null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function serializeAdForStorage(ad: MarketingAd): Record<string, unknown> {
  return stripUndefined({
    id: ad.id,
    placement: ad.placement,
    productId: ad.productId,
    bannerImage: ad.bannerImage,
    headline: ad.headline,
    subheadline: ad.subheadline,
    ctaLabel: ad.ctaLabel,
    badgeText: ad.badgeText,
    isActive: ad.isActive,
    priority: ad.priority,
    startsAt: ad.startsAt ? toIso(ad.startsAt) : null,
    endsAt: ad.endsAt ? toIso(ad.endsAt) : null,
    createdAt: toIso(ad.createdAt),
    updatedAt: toIso(ad.updatedAt),
  }) as Record<string, unknown>;
}

function parseAdsFromSettings(value: Record<string, unknown> | null | undefined): MarketingAd[] {
  if (!value || !Array.isArray(value.ads)) return [];

  return value.ads
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const id = String(record.id ?? index);
      return mapMarketingAd(id, record);
    })
    .filter((ad): ad is MarketingAd => ad !== null)
    .sort((a, b) => b.priority - a.priority || b.updatedAt.getTime() - a.updatedAt.getTime());
}

async function readMarketingAds(): Promise<MarketingAd[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.settings)
    .select('value')
    .eq('key', MARKETING_SETTINGS_KEY)
    .maybeSingle();

  if (error) throw error;
  if (!data) return [];
  return parseAdsFromSettings(data.value as Record<string, unknown>);
}

async function writeMarketingAds(ads: MarketingAd[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Database not available');

  const { error } = await supabase.from(TABLES.settings).upsert(
    {
      key: MARKETING_SETTINGS_KEY,
      value: { ads: ads.map(serializeAdForStorage) },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) throw error;
}

export function isMarketingAdLive(ad: MarketingAd, now = new Date()): boolean {
  if (!ad.isActive) return false;
  if (ad.startsAt && now < ad.startsAt) return false;
  if (ad.endsAt && now > ad.endsAt) return false;
  return true;
}

export function pickActiveMarketingAd(
  ads: MarketingAd[],
  placement: MarketingAdPlacement,
  now = new Date()
): MarketingAd | null {
  return pickActiveMarketingAdForPlacements(ads, [placement], now);
}

export function pickActiveMarketingAdForPlacements(
  ads: MarketingAd[],
  placements: MarketingAdPlacement[],
  now = new Date()
): MarketingAd | null {
  for (const placement of placements) {
    const match =
      ads
        .filter((ad) => ad.placement === placement && isMarketingAdLive(ad, now))
        .sort((a, b) => b.priority - a.priority || b.updatedAt.getTime() - a.updatedAt.getTime())[0] ??
      null;
    if (match) return match;
  }
  return null;
}

export async function getMarketingAds(): Promise<MarketingAd[]> {
  return readMarketingAds();
}

export async function getMarketingAd(id: string): Promise<MarketingAd | null> {
  const ads = await readMarketingAds();
  return ads.find((ad) => ad.id === id) ?? null;
}

export function subscribeMarketingAds(
  onData: (ads: MarketingAd[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const supabase = getSupabaseClient();
  if (!supabase) {
    onData([]);
    return () => {};
  }

  let active = true;

  const refresh = () => {
    if (!active) return;
    void readMarketingAds()
      .then((ads) => {
        if (active) onData(ads);
      })
      .catch((error) => onError?.(error as Error));
  };

  refresh();

  const channel = supabase
    .channel(`settings:marketing:${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.settings,
        filter: `key=eq.${MARKETING_SETTINGS_KEY}`,
      },
      refresh
    )
    .subscribe();

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export async function createMarketingAd(
  ad: Omit<MarketingAd, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const now = new Date();
  const ads = await readMarketingAds();
  const nextAd: MarketingAd = {
    ...ad,
    createdAt: now,
    updatedAt: now,
  };
  await writeMarketingAds([...ads, nextAd]);
}

export async function updateMarketingAd(
  id: string,
  data: Partial<Omit<MarketingAd, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const ads = await readMarketingAds();
  const index = ads.findIndex((ad) => ad.id === id);
  if (index === -1) throw new Error('Ad not found');

  const updated: MarketingAd = {
    ...ads[index],
    ...data,
    updatedAt: new Date(),
  };

  const next = [...ads];
  next[index] = updated;
  await writeMarketingAds(next);
}

export async function deleteMarketingAd(id: string): Promise<void> {
  const ads = await readMarketingAds();
  await writeMarketingAds(ads.filter((ad) => ad.id !== id));
}

export function createMarketingAdId(): string {
  return generateId();
}
