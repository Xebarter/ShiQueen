import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { toDate } from '@/lib/firebase/timestamp';
import { MarketingAd, MarketingAdPlacement } from '@/lib/types/database';

/** Stored under settings (public read) so ads work without a separate rules deploy. */
const MARKETING_SETTINGS_DOC = 'marketing';

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

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
    startsAt: ad.startsAt ? Timestamp.fromDate(ad.startsAt) : null,
    endsAt: ad.endsAt ? Timestamp.fromDate(ad.endsAt) : null,
    createdAt: Timestamp.fromDate(ad.createdAt),
    updatedAt: Timestamp.fromDate(ad.updatedAt),
  }) as Record<string, unknown>;
}

function parseAdsFromSettings(data: Record<string, unknown> | undefined): MarketingAd[] {
  if (!data || !Array.isArray(data.ads)) return [];

  return data.ads
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const id = String(record.id ?? index);
      return mapMarketingAd(id, record);
    })
    .filter((ad): ad is MarketingAd => ad !== null)
    .sort((a, b) => b.priority - a.priority || b.updatedAt.getTime() - a.updatedAt.getTime());
}

function marketingSettingsRef() {
  const db = getFirebaseDb();
  if (!db) throw new Error('Database not available');
  return doc(db, COLLECTIONS.settings, MARKETING_SETTINGS_DOC);
}

async function readMarketingAds(): Promise<MarketingAd[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  const snap = await getDoc(marketingSettingsRef());
  if (!snap.exists()) return [];
  return parseAdsFromSettings(snap.data());
}

async function writeMarketingAds(ads: MarketingAd[]): Promise<void> {
  await setDoc(
    marketingSettingsRef(),
    {
      ads: ads.map(serializeAdForStorage),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
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
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    marketingSettingsRef(),
    (snapshot) => {
      onData(snapshot.exists() ? parseAdsFromSettings(snapshot.data()) : []);
    },
    (error) => onError?.(error)
  );
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
  const db = getFirebaseDb();
  if (!db) throw new Error('Database not available');
  return doc(collection(db, COLLECTIONS.settings)).id;
}
