import { getSupabaseClient } from '@/lib/supabase/client';
import { generateId } from '@/lib/supabase/ids';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate, toIso } from '@/lib/supabase/timestamp';
import type { ProviderApprovalStatus, ServiceProvider } from '@/lib/types/services';

export type ProviderCatalogCounts = {
  listings: number;
  activeListings: number;
};

function mapProvider(row: Record<string, unknown>): ServiceProvider {
  const isActive = Boolean(row.is_active ?? true);
  const rawStatus = row.approval_status;
  const approvalStatus: ProviderApprovalStatus =
    rawStatus === 'pending' ||
    rawStatus === 'approved' ||
    rawStatus === 'rejected' ||
    rawStatus === 'suspended'
      ? rawStatus
      : isActive
        ? 'approved'
        : 'pending';

  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    businessName: String(row.business_name ?? ''),
    phone: String(row.phone ?? ''),
    whatsapp: String(row.whatsapp ?? row.phone ?? ''),
    email: String(row.email ?? ''),
    address: String(row.address ?? ''),
    city: String(row.city ?? 'Kampala'),
    profileImage: String(row.profile_image ?? ''),
    bio: String(row.bio ?? ''),
    experienceYears: Number(row.experience_years ?? 0),
    categoryIds: Array.isArray(row.category_ids) ? (row.category_ids as string[]) : [],
    portfolioImages: Array.isArray(row.portfolio_images)
      ? (row.portfolio_images as string[])
      : [],
    isVerified: Boolean(row.is_verified ?? false),
    isActive,
    ownerUid: row.owner_uid ? String(row.owner_uid) : null,
    approvalStatus,
    approvedAt: row.approved_at ? toDate(row.approved_at) : undefined,
    rejectedAt: row.rejected_at ? toDate(row.rejected_at) : undefined,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    mobileServiceEnabled: Boolean(row.mobile_service_enabled ?? false),
    serviceRadiusKm: Number(row.service_radius_km ?? 0),
    serviceAreas: Array.isArray(row.service_areas) ? (row.service_areas as string[]) : [],
    travelFee: Number(row.travel_fee ?? 0),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    completedJobs: Number(row.completed_jobs ?? 0),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function providerToRow(data: Partial<ServiceProvider> & { id?: string }): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    name: data.name,
    business_name: data.businessName,
    phone: data.phone,
    whatsapp: data.whatsapp,
    email: data.email,
    address: data.address,
    city: data.city,
    profile_image: data.profileImage,
    bio: data.bio,
    experience_years: data.experienceYears,
    category_ids: data.categoryIds,
    portfolio_images: data.portfolioImages,
    is_verified: data.isVerified,
    is_active: data.isActive,
    owner_uid: data.ownerUid,
    approval_status: data.approvalStatus,
    approved_at: data.approvedAt !== undefined ? toIso(data.approvedAt) : undefined,
    rejected_at: data.rejectedAt !== undefined ? toIso(data.rejectedAt) : undefined,
    rejection_reason: data.rejectionReason,
    mobile_service_enabled: data.mobileServiceEnabled,
    service_radius_km: data.serviceRadiusKm,
    service_areas: data.serviceAreas,
    travel_fee: data.travelFee,
    rating: data.rating,
    review_count: data.reviewCount,
    completed_jobs: data.completedJobs,
  });
}

async function fetchServiceProviders(): Promise<ServiceProvider[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.serviceProviders)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapProvider(row as Record<string, unknown>));
}

export function subscribeServiceProviders(
  onData: (providers: ServiceProvider[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.serviceProviders, fetchServiceProviders, onData, onError);
}

export function generateServiceProviderId(): string {
  return `provider-${generateId()}`;
}

export async function getServiceProvider(id: string): Promise<ServiceProvider | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLES.serviceProviders)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapProvider(data as Record<string, unknown>);
}

export async function getProviderListingCounts(
  providerId: string
): Promise<ProviderCatalogCounts> {
  const supabase = getSupabaseClient();
  if (!supabase) return { listings: 0, activeListings: 0 };

  const { data, error } = await supabase
    .from(TABLES.services)
    .select('is_active, is_archived')
    .eq('provider_id', providerId);

  if (error) throw error;

  let activeListings = 0;
  (data ?? []).forEach((row) => {
    if (row.is_active && !row.is_archived) activeListings += 1;
  });

  return { listings: data?.length ?? 0, activeListings };
}

export async function createServiceProvider(
  provider: Omit<ServiceProvider, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { id, ...rest } = provider;
  const { error } = await supabase
    .from(TABLES.serviceProviders)
    .insert(providerToRow({ ...rest, id }));

  if (error) throw error;

  if (provider.approvalStatus === 'pending') {
    void import('@/lib/pwa/notify-client').then(({ notifyAdminApprovalClients }) =>
      notifyAdminApprovalClients('provider', id)
    );
  }
}

export async function updateServiceProvider(
  id: string,
  data: Partial<Omit<ServiceProvider, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase
    .from(TABLES.serviceProviders)
    .update(providerToRow(data))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteServiceProvider(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error: listingError } = await supabase
    .from(TABLES.services)
    .update({ is_active: false, is_archived: true })
    .eq('provider_id', id);

  if (listingError) throw listingError;

  const { error: availabilityError } = await supabase
    .from(TABLES.providerAvailability)
    .delete()
    .eq('id', id);

  if (availabilityError) throw availabilityError;

  const { error: providerError } = await supabase
    .from(TABLES.serviceProviders)
    .delete()
    .eq('id', id);

  if (providerError) throw providerError;
}

export async function setProviderApprovalStatus(
  id: string,
  approvalStatus: ProviderApprovalStatus,
  options?: { rejectionReason?: string }
): Promise<void> {
  const patch: Partial<Omit<ServiceProvider, 'id' | 'createdAt' | 'updatedAt'>> = {
    approvalStatus,
  };

  if (approvalStatus === 'approved') {
    patch.isActive = true;
    patch.isVerified = true;
    patch.approvedAt = new Date();
    patch.rejectionReason = '';
  } else if (approvalStatus === 'rejected') {
    patch.isActive = false;
    patch.rejectedAt = new Date();
    patch.rejectionReason = options?.rejectionReason?.trim() || '';
  } else if (approvalStatus === 'suspended') {
    patch.isActive = false;
  } else if (approvalStatus === 'pending') {
    patch.isActive = false;
  }

  await updateServiceProvider(id, patch);
}

export type ProviderRegistrationInput = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  city: string;
  bio?: string;
  categoryIds: string[];
  mobileServiceEnabled?: boolean;
  serviceAreas?: string[];
};

/** Create a pending provider owned by the given auth user and link the user profile. */
export async function linkProviderRegistration(
  uid: string,
  input: ProviderRegistrationInput
): Promise<{ providerId: string }> {
  const { upsertProviderAvailability } = await import('@/lib/supabase/provider-availability');
  const { getDefaultWeeklySlots } = await import('@/lib/services-utils');

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const businessName = input.businessName.trim();
  const phone = input.phone.trim();
  const city = input.city.trim() || 'Kampala';
  const providerId = generateServiceProviderId();

  await createServiceProvider({
    id: providerId,
    name,
    businessName,
    phone,
    whatsapp: (input.whatsapp || phone).trim(),
    email,
    address: (input.address || '').trim(),
    city,
    profileImage: '',
    bio: (input.bio || '').trim(),
    experienceYears: 0,
    categoryIds: input.categoryIds,
    portfolioImages: [],
    isVerified: false,
    isActive: false,
    ownerUid: uid,
    approvalStatus: 'pending',
    mobileServiceEnabled: Boolean(input.mobileServiceEnabled),
    serviceRadiusKm: input.mobileServiceEnabled ? 15 : 0,
    serviceAreas: input.serviceAreas?.length ? input.serviceAreas : [city],
    travelFee: 0,
    rating: 0,
    reviewCount: 0,
    completedJobs: 0,
  });

  await upsertProviderAvailability({
    id: providerId,
    providerId,
    weeklySlots: getDefaultWeeklySlots(),
    blackoutDates: [],
    slotDurationMinutes: 60,
  });

  const { createUserProfile, getUserProfile, updateUserProfile } = await import(
    '@/lib/supabase/users'
  );

  const existing = await getUserProfile(uid);
  const nextRole =
    existing?.role === 'admin' || existing?.role === 'supplier'
      ? existing.role
      : 'service_provider';

  if (existing) {
    await updateUserProfile(uid, {
      role: nextRole,
      providerId,
      displayName: name,
      phone,
    });
  } else {
    await createUserProfile(uid, email, name, {
      role: 'service_provider',
      providerId,
    });
  }

  return { providerId };
}
