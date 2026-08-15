import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isSupabaseAdminConfigured } from '@/lib/supabase/config';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import { isValidPackageCategory } from '@/lib/package-catalog';
import type { Product } from '@/lib/types/database';
import type { Package } from '@/lib/types/wholesale';
import type { ServiceCategory, ServiceListing } from '@/lib/types/services';

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    sku: String(row.sku ?? ''),
    description: String(row.description ?? ''),
    category: String(row.category ?? ''),
    supplierId: String(row.supplier_id ?? ''),
    price: Number(row.price ?? 0),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    wholesalePrice: row.wholesale_price != null ? Number(row.wholesale_price) : undefined,
    stock: Number(row.stock ?? 0),
    rating: Number(row.rating ?? 0),
    reviews: Number(row.reviews ?? 0),
    image: String(row.image ?? ''),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    sizes: Array.isArray(row.sizes) ? (row.sizes as string[]) : [],
    colors: Array.isArray(row.colors) ? (row.colors as string[]) : [],
    details: Array.isArray(row.details) ? (row.details as string[]) : [],
    isWholesaleEnabled: Boolean(row.is_wholesale_enabled ?? true),
    minOrderQuantity: Number(row.min_order_quantity ?? 10),
    maxOrderQuantity:
      row.max_order_quantity === null || row.max_order_quantity === undefined
        ? null
        : Number(row.max_order_quantity),
    status: (row.status as Product['status']) ?? 'Active',
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function mapPackage(row: Record<string, unknown>): Package {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    supplierId: String(row.supplier_id ?? ''),
    items: Array.isArray(row.items) ? row.items : [],
    rule: row.rule as Package['rule'],
    pricingMode: row.pricing_mode === 'auto' ? 'auto' : 'custom',
    basePrice: Number(row.base_price ?? 0),
    discountedPrice: Number(row.discounted_price ?? 0),
    savingsPercentage: Number(row.savings_percentage ?? 0),
    coverMode:
      row.cover_mode === 'products' ? 'products' : row.cover_mode === 'upload' ? 'upload' : undefined,
    image: row.image ? String(row.image) : undefined,
    coverProductIds: Array.isArray(row.cover_product_ids)
      ? row.cover_product_ids.map(String).slice(0, 4)
      : undefined,
    category:
      typeof row.category === 'string' && isValidPackageCategory(row.category)
        ? row.category
        : undefined,
    tagline: row.tagline ? String(row.tagline) : undefined,
    highlights: Array.isArray(row.highlights) ? row.highlights.map(String).slice(0, 5) : undefined,
    isSignature: row.is_signature === true ? true : undefined,
    isActive: Boolean(row.is_active ?? true),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

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
    supplierId: String(row.supplier_id ?? ''),
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

function getAdmin() {
  if (!isSupabaseAdminConfigured()) return null;
  return getSupabaseAdmin();
}

export async function getProductForSeo(id: string): Promise<Product | null> {
  const admin = getAdmin();
  if (!admin) return null;
  const { data } = await admin.from(TABLES.products).select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  return mapProduct(data as Record<string, unknown>);
}

export async function getPackageForSeo(id: string): Promise<Package | null> {
  const admin = getAdmin();
  if (!admin) return null;
  const { data } = await admin.from(TABLES.packages).select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  return mapPackage(data as Record<string, unknown>);
}

export async function getServiceListingBySlugForSeo(slug: string): Promise<ServiceListing | null> {
  const admin = getAdmin();
  if (!admin) return null;

  const { data: bySlug } = await admin.from(TABLES.services).select('*').eq('slug', slug).maybeSingle();
  if (bySlug) return mapListing(bySlug as Record<string, unknown>);

  const { data: byId } = await admin.from(TABLES.services).select('*').eq('id', slug).maybeSingle();
  if (!byId) return null;
  return mapListing(byId as Record<string, unknown>);
}

export async function getServiceCategoryForSeo(id: string): Promise<ServiceCategory | null> {
  const admin = getAdmin();
  if (!admin) return null;
  const { data } = await admin.from(TABLES.serviceCategories).select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  return {
    id: String(data.id),
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    serviceTypes: Array.isArray(data.service_types) ? (data.service_types as string[]) : [],
    sortOrder: Number(data.sort_order ?? 0),
    isActive: Boolean(data.is_active ?? true),
    createdAt: toDate(data.created_at),
    updatedAt: toDate(data.updated_at),
  };
}

export type SitemapEntry = { id: string; slug?: string; updatedAt: Date };

export async function listProductsForSitemap(): Promise<SitemapEntry[]> {
  const admin = getAdmin();
  if (!admin) return [];
  const { data } = await admin.from(TABLES.products).select('id, updated_at, status');
  return (data ?? [])
    .filter((row) => String(row.status ?? 'Active') !== 'Out of Stock')
    .map((row) => ({ id: String(row.id), updatedAt: toDate(row.updated_at) }));
}

export async function listPackagesForSitemap(): Promise<SitemapEntry[]> {
  const admin = getAdmin();
  if (!admin) return [];
  const { data } = await admin.from(TABLES.packages).select('id, updated_at, is_active');
  return (data ?? [])
    .filter((row) => row.is_active !== false)
    .map((row) => ({ id: String(row.id), updatedAt: toDate(row.updated_at) }));
}

export async function listServicesForSitemap(): Promise<SitemapEntry[]> {
  const admin = getAdmin();
  if (!admin) return [];
  const { data } = await admin.from(TABLES.services).select('id, slug, updated_at, is_active, is_archived');
  return (data ?? [])
    .filter((row) => row.is_active !== false && row.is_archived !== true)
    .map((row) => ({
      id: String(row.id),
      slug: String(row.slug ?? row.id),
      updatedAt: toDate(row.updated_at),
    }));
}

export async function listServiceCategoriesForSitemap(): Promise<SitemapEntry[]> {
  const admin = getAdmin();
  if (!admin) return [];
  const { data } = await admin.from(TABLES.serviceCategories).select('id, updated_at, is_active');
  return (data ?? [])
    .filter((row) => row.is_active !== false)
    .map((row) => ({ id: String(row.id), updatedAt: toDate(row.updated_at) }));
}
