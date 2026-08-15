import { getSupabaseClient } from '@/lib/supabase/client';
import { generateId } from '@/lib/supabase/ids';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import type { ServiceListing } from '@/lib/types/services';
import { DEFAULT_SUPPLIER_ID } from '@/lib/types/suppliers';

function mapListing(row: Record<string, unknown>): ServiceListing {
  return {
    id: String(row.id),
    slug: String(row.slug ?? row.id),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    benefits: Array.isArray(row.benefits) ? (row.benefits as string[]) : [],
    categoryId: String(row.category_id ?? ''),
    serviceType: String(row.service_type ?? ''),
    providerId: String(row.provider_id ?? ''),
    supplierId: String(row.supplier_id ?? DEFAULT_SUPPLIER_ID),
    durationMinutes: Number(row.duration_minutes ?? 60),
    basePrice: Number(row.base_price ?? 0),
    galleryImages: Array.isArray(row.gallery_images) ? (row.gallery_images as string[]) : [],
    isFeatured: Boolean(row.is_featured ?? false),
    isPopular: Boolean(row.is_popular ?? false),
    isActive: Boolean(row.is_active ?? true),
    isArchived: Boolean(row.is_archived ?? false),
    supportsMobile: Boolean(row.supports_mobile ?? false),
    supportsInStudio: Boolean(row.supports_in_studio ?? true),
    location: String(row.location ?? ''),
    bookingCount: Number(row.booking_count ?? 0),
    viewCount: Number(row.view_count ?? 0),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function listingToRow(data: Partial<ServiceListing> & { id?: string }): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    benefits: data.benefits,
    category_id: data.categoryId,
    service_type: data.serviceType,
    provider_id: data.providerId,
    supplier_id: data.supplierId,
    duration_minutes: data.durationMinutes,
    base_price: data.basePrice,
    gallery_images: data.galleryImages,
    is_featured: data.isFeatured,
    is_popular: data.isPopular,
    is_active: data.isActive,
    is_archived: data.isArchived,
    supports_mobile: data.supportsMobile,
    supports_in_studio: data.supportsInStudio,
    location: data.location,
    booking_count: data.bookingCount,
    view_count: data.viewCount,
    rating: data.rating,
    review_count: data.reviewCount,
    sort_order: data.sortOrder,
  });
}

async function fetchServiceListings(): Promise<ServiceListing[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.services)
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapListing(row as Record<string, unknown>));
}

export function subscribeServiceListings(
  onData: (listings: ServiceListing[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.services, fetchServiceListings, onData, onError);
}

export async function getServiceListing(id: string): Promise<ServiceListing | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLES.services)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapListing(data as Record<string, unknown>);
}

export async function getServiceListingBySlug(slug: string): Promise<ServiceListing | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLES.services)
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapListing(data as Record<string, unknown>);
}

export function generateServiceListingId(): string {
  return `svc-${generateId()}`;
}

export async function createServiceListing(
  listing: Omit<ServiceListing, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { id, ...rest } = listing;
  const { error } = await supabase.from(TABLES.services).insert(listingToRow({ ...rest, id }));
  if (error) throw error;
}

export async function updateServiceListing(
  id: string,
  data: Partial<Omit<ServiceListing, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from(TABLES.services).update(listingToRow(data)).eq('id', id);
  if (error) throw error;
}

export async function deleteServiceListing(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from(TABLES.services).delete().eq('id', id);
  if (error) throw error;
}

export async function incrementServiceViewCount(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { data } = await supabase
      .from(TABLES.services)
      .select('view_count')
      .eq('id', id)
      .maybeSingle();

    if (!data) return;

    await supabase
      .from(TABLES.services)
      .update({ view_count: Number(data.view_count ?? 0) + 1 })
      .eq('id', id);
  } catch {
    // non-blocking
  }
}

export async function incrementServiceBookingCount(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { data } = await supabase
      .from(TABLES.services)
      .select('booking_count')
      .eq('id', id)
      .maybeSingle();

    if (!data) return;

    await supabase
      .from(TABLES.services)
      .update({ booking_count: Number(data.booking_count ?? 0) + 1 })
      .eq('id', id);
  } catch {
    // non-blocking
  }
}
