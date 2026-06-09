import type {
  ServiceCategory,
  ServiceListing,
  ServiceProvider,
  ServiceSearchFilters,
  ServiceSortMode,
  Weekday,
  ProviderAvailability,
  ServiceBooking,
} from '@/lib/types/services';
import { isRemoteProductImage } from '@/components/product-image';

const WEEKDAYS: Weekday[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export function slugifyServiceName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export { buildTelLink, buildWhatsAppLink } from '@/lib/phone-utils';

export function resolveListingImage(listing: ServiceListing): string | null {
  for (const src of listing.galleryImages) {
    if (isRemoteProductImage(src)) return src;
  }
  return null;
}

export function resolveCategoryCoverImage(
  categoryId: string,
  listings: ServiceListing[]
): string | null {
  const inCategory = listings.filter(
    (l) => l.categoryId === categoryId && l.isActive && !l.isArchived
  );
  for (const listing of inCategory) {
    const img = resolveListingImage(listing);
    if (img) return img;
  }
  return null;
}

export function countCategoryServices(categoryId: string, listings: ServiceListing[]): number {
  return listings.filter(
    (l) => l.categoryId === categoryId && l.isActive && !l.isArchived
  ).length;
}

export function getProviderById(
  providers: ServiceProvider[],
  id: string
): ServiceProvider | undefined {
  return providers.find((p) => p.id === id);
}

export function filterServices(
  listings: ServiceListing[],
  providers: ServiceProvider[],
  categories: ServiceCategory[],
  filters: ServiceSearchFilters
): ServiceListing[] {
  let result = listings.filter((l) => l.isActive && !l.isArchived);

  if (filters.categoryId) {
    result = result.filter((l) => l.categoryId === filters.categoryId);
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    result = result.filter((l) => {
      const provider = getProviderById(providers, l.providerId);
      const category = categories.find((c) => c.id === l.categoryId);
      return (
        l.name.toLowerCase().includes(q) ||
        l.serviceType.toLowerCase().includes(q) ||
        provider?.name.toLowerCase().includes(q) ||
        provider?.businessName.toLowerCase().includes(q) ||
        category?.name.toLowerCase().includes(q)
      );
    });
  }

  if (filters.city?.trim()) {
    const city = filters.city.trim().toLowerCase();
    result = result.filter((l) => {
      const provider = getProviderById(providers, l.providerId);
      if (!provider) return false;
      return (
        provider.city.toLowerCase().includes(city) ||
        provider.serviceAreas.some((a) => a.toLowerCase().includes(city)) ||
        l.location.toLowerCase().includes(city)
      );
    });
  }

  if (filters.priceMin !== undefined) {
    result = result.filter((l) => l.basePrice >= filters.priceMin!);
  }
  if (filters.priceMax !== undefined) {
    result = result.filter((l) => l.basePrice <= filters.priceMax!);
  }
  if (filters.minRating !== undefined && filters.minRating > 0) {
    result = result.filter((l) => l.rating >= filters.minRating!);
  }
  if (filters.mobileOnly) {
    result = result.filter((l) => l.supportsMobile);
  }
  if (filters.inStudioOnly) {
    result = result.filter((l) => l.supportsInStudio);
  }

  return sortServices(result, filters.sort ?? 'popular');
}

export function sortServices(
  listings: ServiceListing[],
  mode: ServiceSortMode
): ServiceListing[] {
  const copy = [...listings];
  switch (mode) {
    case 'trending':
      return copy.sort(
        (a, b) => b.viewCount + b.bookingCount * 3 - (a.viewCount + a.bookingCount * 3)
      );
    case 'newest':
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case 'price_asc':
      return copy.sort((a, b) => a.basePrice - b.basePrice);
    case 'price_desc':
      return copy.sort((a, b) => b.basePrice - a.basePrice);
    case 'popular':
    default:
      return copy.sort(
        (a, b) =>
          Number(b.isPopular) - Number(a.isPopular) ||
          b.bookingCount - a.bookingCount ||
          b.rating - a.rating
      );
  }
}

export function getPopularServices(listings: ServiceListing[], limit = 8): ServiceListing[] {
  return sortServices(
    listings.filter((l) => l.isActive && !l.isArchived),
    'popular'
  ).slice(0, limit);
}

export function getTrendingServices(listings: ServiceListing[], limit = 8): ServiceListing[] {
  return sortServices(
    listings.filter((l) => l.isActive && !l.isArchived),
    'trending'
  ).slice(0, limit);
}

export function getMostBookedServices(listings: ServiceListing[], limit = 8): ServiceListing[] {
  return [...listings]
    .filter((l) => l.isActive && !l.isArchived)
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, limit);
}

export function getFeaturedServices(listings: ServiceListing[], limit = 8): ServiceListing[] {
  return [...listings]
    .filter((l) => l.isActive && !l.isArchived && l.isFeatured)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function getNewProviders(providers: ServiceProvider[], limit = 6): ServiceProvider[] {
  return [...providers]
    .filter((p) => p.isActive)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getWeekdayFromDate(dateStr: string): Weekday {
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  const map: Weekday[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
  ];
  return map[day] ?? 'monday';
}

export function getAvailableTimeSlots(
  availability: ProviderAvailability | null,
  bookings: ServiceBooking[],
  date: string
): string[] {
  if (!availability) {
    return ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  }

  if (availability.blackoutDates.includes(date)) return [];

  const weekday = getWeekdayFromDate(date);
  const ranges = availability.weeklySlots[weekday] ?? [];
  if (ranges.length === 0) return [];

  const duration = availability.slotDurationMinutes || 60;
  const slots: string[] = [];
  const booked = new Set(
    bookings
      .filter((b) => b.date === date && b.status !== 'cancelled')
      .map((b) => b.timeSlot)
  );

  for (const range of ranges) {
    let cursor = parseTimeToMinutes(range.start);
    const end = parseTimeToMinutes(range.end);
    while (cursor + duration <= end) {
      const slot = formatMinutesToTime(cursor);
      if (!booked.has(slot)) slots.push(slot);
      cursor += duration;
    }
  }

  return slots;
}

export function getDefaultWeeklySlots(): ProviderAvailability['weeklySlots'] {
  const workday: { start: string; end: string }[] = [{ start: '09:00', end: '18:00' }];
  return {
    monday: workday,
    tuesday: workday,
    wednesday: workday,
    thursday: workday,
    friday: workday,
    saturday: [{ start: '10:00', end: '16:00' }],
    sunday: [],
  };
}

export { WEEKDAYS };

export type ServicePricePreset = import('@/lib/types/services').ServicePricePreset;

export const SERVICE_PRICE_PRESETS: {
  id: ServicePricePreset;
  label: string;
  priceMin?: number;
  priceMax?: number;
}[] = [
  { id: 'all', label: 'All prices' },
  { id: 'under-100k', label: 'Under UGX 100K', priceMax: 100_000 },
  { id: '100k-300k', label: 'UGX 100K – 300K', priceMin: 100_000, priceMax: 300_000 },
  { id: '300k-plus', label: 'UGX 300K+', priceMin: 300_000 },
];

export function pricePresetToRange(preset: ServicePricePreset): {
  priceMin?: number;
  priceMax?: number;
} {
  const match = SERVICE_PRICE_PRESETS.find((p) => p.id === preset);
  if (!match || preset === 'all') return {};
  return { priceMin: match.priceMin, priceMax: match.priceMax };
}
