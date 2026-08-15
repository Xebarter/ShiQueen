#!/usr/bin/env node
/**
 * One-time migration: Firestore collections → Supabase Postgres
 *
 * Usage: node scripts/migrate/firestore-data.mjs
 */

import './load-env.mjs';
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

const COLLECTION_TO_TABLE = {
  users: 'profiles',
  products: 'products',
  orders: 'orders',
  packages: 'packages',
  bulkOrders: 'bulk_orders',
  wholesaleAccounts: 'wholesale_accounts',
  suppliers: 'suppliers',
  serviceCategories: 'service_categories',
  serviceProviders: 'service_providers',
  services: 'services',
  serviceBookings: 'service_bookings',
  serviceReviews: 'service_reviews',
  providerAvailability: 'provider_availability',
  sharedCheckouts: 'shared_checkouts',
  sharedBookings: 'shared_bookings',
};

function toIso(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapDoc(collection, id, data) {
  switch (collection) {
    case 'users':
      return {
        id,
        email: data.email ?? '',
        display_name: data.displayName ?? null,
        phone: data.phone ?? null,
        photo_url: data.photoURL ?? null,
        role: data.role ?? 'customer',
        supplier_id: data.supplierId ?? null,
        provider_id: data.providerId ?? null,
        preferences: data.preferences ?? null,
        default_address: data.defaultAddress ?? null,
        fcm_tokens: data.fcmTokens ?? [],
        created_at: toIso(data.createdAt),
        updated_at: toIso(data.updatedAt),
      };
    case 'suppliers':
      return {
        id,
        name: data.name ?? '',
        company_name: data.companyName ?? '',
        contact_name: data.contactName ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        whatsapp: data.whatsapp ?? data.phone ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        notes: data.notes ?? '',
        logo: data.logo ?? data.profileImage ?? '',
        categories: data.categories ?? ['products', 'packages', 'services'],
        is_default: data.isDefault ?? false,
        is_active: data.isActive ?? true,
        approval_status: data.approvalStatus ?? 'approved',
        owner_uid: data.ownerUid ?? null,
        approved_at: toIso(data.approvedAt),
        rejected_at: toIso(data.rejectedAt),
        rejection_reason: data.rejectionReason ?? null,
        created_at: toIso(data.createdAt),
        updated_at: toIso(data.updatedAt),
      };
    case 'serviceCategories':
      return {
        id,
        name: data.name ?? '',
        description: data.description ?? '',
        service_types: data.serviceTypes ?? [],
        sort_order: data.sortOrder ?? 0,
        is_active: data.isActive ?? true,
        created_at: toIso(data.createdAt),
        updated_at: toIso(data.updatedAt),
      };
    case 'serviceProviders':
      return {
        id,
        name: data.name ?? '',
        business_name: data.businessName ?? '',
        phone: data.phone ?? '',
        whatsapp: data.whatsapp ?? data.phone ?? '',
        email: data.email ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        profile_image: data.profileImage ?? '',
        bio: data.bio ?? '',
        experience_years: data.experienceYears ?? 0,
        category_ids: data.categoryIds ?? [],
        portfolio_images: data.portfolioImages ?? [],
        is_verified: data.isVerified ?? false,
        is_active: data.isActive ?? false,
        owner_uid: data.ownerUid ?? null,
        approval_status: data.approvalStatus ?? 'pending',
        approved_at: toIso(data.approvedAt),
        rejected_at: toIso(data.rejectedAt),
        rejection_reason: data.rejectionReason ?? null,
        mobile_service_enabled: data.mobileServiceEnabled ?? false,
        service_radius_km: data.serviceRadiusKm ?? 0,
        service_areas: data.serviceAreas ?? [],
        travel_fee: data.travelFee ?? 0,
        rating: data.rating ?? 0,
        review_count: data.reviewCount ?? 0,
        completed_jobs: data.completedJobs ?? 0,
        created_at: toIso(data.createdAt),
        updated_at: toIso(data.updatedAt),
      };
    case 'products':
      return {
        id,
        name: data.name ?? '',
        sku: data.sku ?? '',
        description: data.description ?? '',
        category: data.category ?? '',
        supplier_id: data.supplierId ?? 'supplier-shequeen-default',
        price: data.price ?? 0,
        original_price: data.originalPrice ?? null,
        stock: data.stock ?? 0,
        rating: data.rating ?? 0,
        reviews: data.reviews ?? 0,
        image: data.image ?? '',
        images: data.images ?? [],
        sizes: data.sizes ?? [],
        colors: data.colors ?? [],
        details: data.details ?? [],
        is_wholesale_enabled: data.isWholesaleEnabled ?? true,
        min_order_quantity: data.minOrderQuantity ?? 10,
        max_order_quantity: data.maxOrderQuantity ?? null,
        status: data.status ?? 'Active',
        created_at: toIso(data.createdAt),
        updated_at: toIso(data.updatedAt),
      };
    case 'packages':
      return {
        id,
        name: data.name ?? '',
        description: data.description ?? '',
        supplier_id: data.supplierId ?? 'supplier-shequeen-default',
        items: data.items ?? [],
        rule: data.rule ?? {},
        pricing_mode: data.pricingMode ?? 'custom',
        base_price: data.basePrice ?? 0,
        discounted_price: data.discountedPrice ?? 0,
        savings_percentage: data.savingsPercentage ?? 0,
        cover_mode: data.coverMode ?? null,
        image: data.image ?? null,
        cover_product_ids: data.coverProductIds ?? null,
        category: data.category ?? null,
        tagline: data.tagline ?? null,
        highlights: data.highlights ?? null,
        tier: data.tier ?? null,
        is_signature: data.isSignature ?? null,
        is_active: data.isActive ?? true,
        created_at: toIso(data.createdAt),
        updated_at: toIso(data.updatedAt),
      };
    case 'services':
      return {
        id,
        slug: data.slug ?? id,
        name: data.name ?? '',
        description: data.description ?? '',
        benefits: data.benefits ?? [],
        category_id: data.categoryId ?? '',
        service_type: data.serviceType ?? '',
        provider_id: data.providerId ?? '',
        supplier_id: data.supplierId ?? 'supplier-shequeen-default',
        duration_minutes: data.durationMinutes ?? 60,
        base_price: data.basePrice ?? 0,
        gallery_images: data.galleryImages ?? [],
        is_featured: data.isFeatured ?? false,
        is_popular: data.isPopular ?? false,
        is_active: data.isActive ?? true,
        is_archived: data.isArchived ?? false,
        supports_mobile: data.supportsMobile ?? false,
        supports_in_studio: data.supportsInStudio ?? true,
        location: data.location ?? '',
        booking_count: data.bookingCount ?? 0,
        view_count: data.viewCount ?? 0,
        rating: data.rating ?? 0,
        review_count: data.reviewCount ?? 0,
        sort_order: data.sortOrder ?? 0,
        created_at: toIso(data.createdAt),
        updated_at: toIso(data.updatedAt),
      };
    case 'providerAvailability':
      return {
        id,
        provider_id: data.providerId ?? id,
        weekly_slots: data.weeklySlots ?? {},
        blackout_dates: data.blackoutDates ?? [],
        slot_duration_minutes: data.slotDurationMinutes ?? 60,
        updated_at: toIso(data.updatedAt),
      };
    case 'orders':
      return {
        id,
        user_id: data.userId ?? null,
        customer_name: data.customerName ?? '',
        email: data.email ?? '',
        items: data.items ?? [],
        subtotal: data.subtotal ?? 0,
        tax: data.tax ?? 0,
        total: data.total ?? 0,
        shipping_address: data.shippingAddress ?? {},
        status: data.status ?? 'pending',
        order_type: data.orderType ?? 'retail',
        payment_method: data.paymentMethod ?? null,
        payment_status: data.paymentStatus ?? null,
        paytota_purchase_id: data.paytotaPurchaseId ?? null,
        paytota_reference: data.paytotaReference ?? null,
        card_trans_token: data.cardTransToken ?? null,
        card_trans_ref: data.cardTransRef ?? null,
        supplier_ids: data.supplierIds ?? [],
        created_at: toIso(data.createdAt),
        updated_at: toIso(data.updatedAt),
      };
    case 'serviceBookings':
      return {
        id,
        service_id: data.serviceId ?? '',
        provider_id: data.providerId ?? '',
        user_id: data.userId ?? null,
        customer_name: data.customerName ?? '',
        customer_phone: data.customerPhone ?? '',
        customer_email: data.customerEmail ?? null,
        date: data.date ?? '',
        time_slot: data.timeSlot ?? '',
        location_type: data.locationType ?? 'studio',
        customer_address: data.customerAddress ?? null,
        notes: data.notes ?? null,
        status: data.status ?? 'pending',
        amount: data.amount ?? 0,
        travel_fee: data.travelFee ?? 0,
        total: data.total ?? data.amount ?? 0,
        service_name: data.serviceName ?? '',
        provider_name: data.providerName ?? '',
        payment_method: data.paymentMethod ?? null,
        payment_status: data.paymentStatus ?? null,
        paytota_purchase_id: data.paytotaPurchaseId ?? null,
        paytota_reference: data.paytotaReference ?? null,
        shared_booking_token: data.sharedBookingToken ?? null,
        created_at: toIso(data.createdAt),
        updated_at: toIso(data.updatedAt),
      };
    case 'serviceReviews':
      return {
        id,
        service_id: data.serviceId ?? '',
        provider_id: data.providerId ?? '',
        booking_id: data.bookingId ?? null,
        rating: data.rating ?? 5,
        comment: data.comment ?? '',
        customer_name: data.customerName ?? '',
        is_visible: data.isVisible ?? true,
        created_at: toIso(data.createdAt),
      };
    case 'bulkOrders':
      return {
        id,
        customer_id: data.customerId ?? '',
        items: data.items ?? [],
        total_amount: data.totalAmount ?? 0,
        order_type: data.orderType ?? 'wholesale',
        status: data.status ?? 'pending',
        notes: data.notes ?? null,
        requested_at: toIso(data.requestedAt),
        approved_at: toIso(data.approvedAt),
        shipped_at: toIso(data.shippedAt),
      };
    case 'wholesaleAccounts':
      return {
        id,
        customer_id: data.customerId ?? '',
        company_name: data.companyName ?? '',
        tax_id: data.taxId ?? null,
        status: data.status ?? 'pending',
        discount: data.discount ?? null,
        credit_limit: data.creditLimit ?? null,
        created_at: toIso(data.createdAt),
        approved_at: toIso(data.approvedAt),
      };
    case 'sharedCheckouts':
      return {
        id,
        status: data.status ?? 'pending',
        cart_items: data.cartItems ?? [],
        order_items: data.orderItems ?? [],
        subtotal: data.subtotal ?? 0,
        total: data.total ?? 0,
        order_type: data.orderType ?? 'retail',
        recipient_name: data.recipientName ?? '',
        shipping_address: data.shippingAddress ?? {},
        sender_user_id: data.senderUserId ?? null,
        sender_message: data.senderMessage ?? null,
        order_id: data.orderId ?? null,
        expires_at: toIso(data.expiresAt),
        created_at: toIso(data.createdAt),
        paid_at: toIso(data.paidAt),
      };
    case 'sharedBookings':
      return {
        id,
        status: data.status ?? 'pending',
        booking_id: data.bookingId ?? '',
        snapshot: data.snapshot ?? {},
        sender_user_id: data.senderUserId ?? null,
        sender_message: data.senderMessage ?? null,
        expires_at: toIso(data.expiresAt),
        created_at: toIso(data.createdAt),
        paid_at: toIso(data.paidAt),
      };
    default:
      throw new Error(`No field mapper for collection: ${collection}`);
  }
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
if (!serviceAccount.project_id) {
  console.error('Set FIREBASE_SERVICE_ACCOUNT_JSON');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function migrateCollection(collection) {
  const table = COLLECTION_TO_TABLE[collection];
  if (!table) return;

  const snap = await db.collection(collection).get();
  if (snap.empty) {
    console.log(`Skip empty ${collection}`);
    return;
  }

  const rows = snap.docs.map((doc) => mapDoc(collection, doc.id, doc.data()));
  const chunkSize = 100;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk);
    if (error) throw new Error(`${collection}: ${error.message}`);
  }

  console.log(`Migrated ${rows.length} ${collection} → ${table}`);
}

async function migrateSettings() {
  const marketing = await db.collection('settings').doc('marketing').get();
  if (marketing.exists) {
    await supabase.from('settings').upsert({
      key: 'marketing',
      value: marketing.data() ?? {},
    });
  }

  const analytics = await db.collection('settings').doc('analytics').get();
  if (analytics.exists) {
    await supabase.from('settings').upsert({
      key: 'analytics',
      value: analytics.data() ?? {},
    });
  }

  const app = await db.collection('settings').doc('app').get();
  if (app.exists) {
    await supabase.from('settings').upsert({
      key: 'app',
      value: app.data() ?? {},
    });
  }
}

async function main() {
  const order = [
    'users',
    'suppliers',
    'serviceCategories',
    'serviceProviders',
    'products',
    'packages',
    'services',
    'providerAvailability',
    'orders',
    'serviceBookings',
    'serviceReviews',
    'bulkOrders',
    'wholesaleAccounts',
    'sharedCheckouts',
    'sharedBookings',
  ];

  for (const collection of order) {
    await migrateCollection(collection);
  }

  await migrateSettings();
  console.log('Firestore migration complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
