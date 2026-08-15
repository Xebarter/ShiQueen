import { getSupabaseClient } from '@/lib/supabase/client';
import { isSupabaseOfflineError } from '@/lib/supabase/errors';
import { TABLES } from '@/lib/supabase/tables';
import {
  SEED_PROVIDER_AVAILABILITY,
  SEED_SERVICE_CATEGORIES,
  SEED_SERVICE_LISTINGS,
  SEED_SERVICE_PROVIDERS,
} from '@/lib/firebase/seed-services-data';
import { ensureSuppliersReady } from '@/lib/supabase/suppliers';

let servicesSeedPromise: Promise<void> | null = null;

export async function ensureServicesSeeded(): Promise<void> {
  if (servicesSeedPromise) return servicesSeedPromise;

  servicesSeedPromise = (async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await ensureSuppliersReady();

    const { count } = await supabase
      .from(TABLES.serviceCategories)
      .select('*', { count: 'exact', head: true });
    if (count) return;

    await supabase.from(TABLES.serviceCategories).insert(
      SEED_SERVICE_CATEGORIES.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        service_types: c.serviceTypes,
        sort_order: c.sortOrder,
        is_active: c.isActive,
      }))
    );

    await supabase.from(TABLES.serviceProviders).insert(
      SEED_SERVICE_PROVIDERS.map((p) => {
        const { id, businessName, profileImage, experienceYears, categoryIds, portfolioImages, ...rest } = p;
        return {
          id,
          ...rest,
          business_name: businessName,
          profile_image: profileImage,
          experience_years: experienceYears,
          category_ids: categoryIds,
          portfolio_images: portfolioImages,
          owner_uid: rest.ownerUid,
          approval_status: rest.approvalStatus,
          mobile_service_enabled: rest.mobileServiceEnabled,
          service_radius_km: rest.serviceRadiusKm,
          service_areas: rest.serviceAreas,
          travel_fee: rest.travelFee,
          review_count: rest.reviewCount,
          completed_jobs: rest.completedJobs,
          is_verified: rest.isVerified,
          is_active: rest.isActive,
        };
      })
    );

    await supabase.from(TABLES.services).insert(
      SEED_SERVICE_LISTINGS.map((s) => {
        const {
          id,
          categoryId,
          serviceType,
          providerId,
          supplierId,
          durationMinutes,
          galleryImages,
          isFeatured,
          isPopular,
          isActive,
          isArchived,
          supportsMobile,
          supportsInStudio,
          bookingCount,
          viewCount,
          reviewCount,
          sortOrder,
          ...rest
        } = s;
        return {
          id,
          ...rest,
          category_id: categoryId,
          service_type: serviceType,
          provider_id: providerId,
          supplier_id: supplierId,
          duration_minutes: durationMinutes,
          gallery_images: galleryImages,
          is_featured: isFeatured,
          is_popular: isPopular,
          is_active: isActive,
          is_archived: isArchived,
          supports_mobile: supportsMobile,
          supports_in_studio: supportsInStudio,
          booking_count: bookingCount,
          view_count: viewCount,
          review_count: reviewCount,
          sort_order: sortOrder,
        };
      })
    );

    await supabase.from(TABLES.providerAvailability).insert(
      SEED_PROVIDER_AVAILABILITY.map((a) => ({
        id: a.id,
        provider_id: a.providerId,
        weekly_slots: a.weeklySlots,
        blackout_dates: a.blackoutDates,
        slot_duration_minutes: a.slotDurationMinutes,
      }))
    );
  })().catch((error) => {
    servicesSeedPromise = null;
    if (isSupabaseOfflineError(error)) {
      console.warn('[ShiQueen] Supabase offline — skipping services seed.');
      return;
    }
    console.error('[ShiQueen] Services seed failed:', error);
  });

  return servicesSeedPromise;
}
