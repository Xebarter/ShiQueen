import { COLLECTIONS } from '@/lib/firebase/collections';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { isValidPackageCategory } from '@/lib/package-catalog';
import type { Product } from '@/lib/types/database';
import type { Package } from '@/lib/types/wholesale';
import type { ServiceCategory, ServiceListing } from '@/lib/types/services';
import type { DocumentData } from 'firebase-admin/firestore';

function toDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  return new Date();
}

function mapProduct(id: string, data: DocumentData): Product {
  return {
    id,
    name: String(data.name ?? ''),
    sku: String(data.sku ?? ''),
    description: String(data.description ?? ''),
    category: String(data.category ?? ''),
    supplierId: String(data.supplierId ?? ''),
    price: Number(data.price ?? 0),
    originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
    stock: Number(data.stock ?? 0),
    rating: Number(data.rating ?? 0),
    reviews: Number(data.reviews ?? 0),
    image: String(data.image ?? ''),
    images: Array.isArray(data.images) ? (data.images as string[]) : [],
    sizes: Array.isArray(data.sizes) ? (data.sizes as string[]) : [],
    colors: Array.isArray(data.colors) ? (data.colors as string[]) : [],
    details: Array.isArray(data.details) ? (data.details as string[]) : [],
    isWholesaleEnabled: Boolean(data.isWholesaleEnabled ?? true),
    minOrderQuantity: Number(data.minOrderQuantity ?? 10),
    maxOrderQuantity:
      data.maxOrderQuantity === null || data.maxOrderQuantity === undefined
        ? null
        : Number(data.maxOrderQuantity),
    status: (data.status as Product['status']) ?? 'Active',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapPackage(id: string, data: DocumentData): Package {
  return {
    id,
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    supplierId: String(data.supplierId ?? ''),
    items: Array.isArray(data.items) ? data.items : [],
    rule: data.rule as Package['rule'],
    pricingMode: data.pricingMode === 'auto' ? 'auto' : 'custom',
    basePrice: Number(data.basePrice ?? 0),
    discountedPrice: Number(data.discountedPrice ?? 0),
    savingsPercentage: Number(data.savingsPercentage ?? 0),
    coverMode:
      data.coverMode === 'products' ? 'products' : data.coverMode === 'upload' ? 'upload' : undefined,
    image: data.image ? String(data.image) : undefined,
    coverProductIds: Array.isArray(data.coverProductIds)
      ? data.coverProductIds.map(String).slice(0, 4)
      : undefined,
    category:
      typeof data.category === 'string' && isValidPackageCategory(data.category)
        ? data.category
        : undefined,
    tagline: data.tagline ? String(data.tagline) : undefined,
    highlights: Array.isArray(data.highlights) ? data.highlights.map(String).slice(0, 5) : undefined,
    isSignature: data.isSignature === true ? true : undefined,
    isActive: Boolean(data.isActive ?? true),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapListing(id: string, data: DocumentData): ServiceListing {
  return {
    id,
    slug: String(data.slug ?? id),
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    benefits: Array.isArray(data.benefits) ? (data.benefits as string[]) : [],
    categoryId: String(data.categoryId ?? ''),
    serviceType: String(data.serviceType ?? ''),
    providerId: String(data.providerId ?? ''),
    supplierId: String(data.supplierId ?? ''),
    durationMinutes: Number(data.durationMinutes ?? 60),
    basePrice: Number(data.basePrice ?? 0),
    galleryImages: Array.isArray(data.galleryImages) ? (data.galleryImages as string[]) : [],
    isFeatured: Boolean(data.isFeatured ?? false),
    isPopular: Boolean(data.isPopular ?? false),
    isActive: Boolean(data.isActive ?? true),
    isArchived: Boolean(data.isArchived ?? false),
    supportsMobile: Boolean(data.supportsMobile ?? false),
    supportsInStudio: Boolean(data.supportsInStudio ?? true),
    location: String(data.location ?? ''),
    bookingCount: Number(data.bookingCount ?? 0),
    viewCount: Number(data.viewCount ?? 0),
    rating: Number(data.rating ?? 0),
    reviewCount: Number(data.reviewCount ?? 0),
    sortOrder: Number(data.sortOrder ?? 0),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

async function getDb() {
  if (!isFirebaseAdminConfigured()) return null;
  const { getAdminDb } = await import('@/lib/firebase/admin');
  return getAdminDb();
}

export async function getProductForSeo(id: string): Promise<Product | null> {
  const db = await getDb();
  if (!db) return null;
  const snap = await db.collection(COLLECTIONS.products).doc(id).get();
  if (!snap.exists) return null;
  return mapProduct(snap.id, snap.data()!);
}

export async function getPackageForSeo(id: string): Promise<Package | null> {
  const db = await getDb();
  if (!db) return null;
  const snap = await db.collection(COLLECTIONS.packages).doc(id).get();
  if (!snap.exists) return null;
  return mapPackage(snap.id, snap.data()!);
}

export async function getServiceListingBySlugForSeo(slug: string): Promise<ServiceListing | null> {
  const db = await getDb();
  if (!db) return null;
  const snap = await db.collection(COLLECTIONS.services).where('slug', '==', slug).limit(1).get();
  if (!snap.empty) {
    const doc = snap.docs[0]!;
    return mapListing(doc.id, doc.data());
  }
  const byId = await db.collection(COLLECTIONS.services).doc(slug).get();
  if (!byId.exists) return null;
  return mapListing(byId.id, byId.data()!);
}

export async function getServiceCategoryForSeo(id: string): Promise<ServiceCategory | null> {
  const db = await getDb();
  if (!db) return null;
  const snap = await db.collection(COLLECTIONS.serviceCategories).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return {
    id: snap.id,
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    serviceTypes: Array.isArray(data.serviceTypes) ? (data.serviceTypes as string[]) : [],
    sortOrder: Number(data.sortOrder ?? 0),
    isActive: Boolean(data.isActive ?? true),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export type SitemapEntry = { id: string; slug?: string; updatedAt: Date };

export async function listProductsForSitemap(): Promise<SitemapEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const snap = await db.collection(COLLECTIONS.products).select('updatedAt', 'status').get();
  return snap.docs
    .filter((doc) => String(doc.data().status ?? 'Active') !== 'Out of Stock')
    .map((doc) => ({ id: doc.id, updatedAt: toDate(doc.data().updatedAt) }));
}

export async function listPackagesForSitemap(): Promise<SitemapEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const snap = await db.collection(COLLECTIONS.packages).select('updatedAt', 'isActive').get();
  return snap.docs
    .filter((doc) => doc.data().isActive !== false)
    .map((doc) => ({ id: doc.id, updatedAt: toDate(doc.data().updatedAt) }));
}

export async function listServicesForSitemap(): Promise<SitemapEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const snap = await db
    .collection(COLLECTIONS.services)
    .select('updatedAt', 'slug', 'isActive', 'isArchived')
    .get();
  return snap.docs
    .filter((doc) => doc.data().isActive !== false && doc.data().isArchived !== true)
    .map((doc) => ({
      id: doc.id,
      slug: String(doc.data().slug ?? doc.id),
      updatedAt: toDate(doc.data().updatedAt),
    }));
}

export async function listServiceCategoriesForSitemap(): Promise<SitemapEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const snap = await db
    .collection(COLLECTIONS.serviceCategories)
    .select('updatedAt', 'isActive')
    .get();
  return snap.docs
    .filter((doc) => doc.data().isActive !== false)
    .map((doc) => ({ id: doc.id, updatedAt: toDate(doc.data().updatedAt) }));
}
