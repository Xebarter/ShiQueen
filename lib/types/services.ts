import type { PaymentMethod, PaymentStatus } from '@/lib/types/database';
import type { SupplierApprovalStatus } from '@/lib/types/suppliers';

export type ProviderApprovalStatus = SupplierApprovalStatus;

export type ServiceBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ServiceLocationType = 'studio' | 'mobile';

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface TimeRange {
  start: string;
  end: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  serviceTypes: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceProvider {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  profileImage: string;
  bio: string;
  experienceYears: number;
  categoryIds: string[];
  portfolioImages: string[];
  isVerified: boolean;
  isActive: boolean;
  ownerUid: string | null;
  approvalStatus: ProviderApprovalStatus;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  mobileServiceEnabled: boolean;
  serviceRadiusKm: number;
  serviceAreas: string[];
  travelFee: number;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceListing {
  id: string;
  slug: string;
  name: string;
  description: string;
  benefits: string[];
  categoryId: string;
  serviceType: string;
  providerId: string;
  supplierId: string;
  durationMinutes: number;
  basePrice: number;
  galleryImages: string[];
  isFeatured: boolean;
  isPopular: boolean;
  isActive: boolean;
  isArchived: boolean;
  supportsMobile: boolean;
  supportsInStudio: boolean;
  location: string;
  bookingCount: number;
  viewCount: number;
  rating: number;
  reviewCount: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  providerId: string;
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  timeSlot: string;
  locationType: ServiceLocationType;
  customerAddress?: string;
  notes?: string;
  status: ServiceBookingStatus;
  /** Base service price (UGX) */
  amount: number;
  /** Travel fee when mobile (UGX) */
  travelFee: number;
  /** amount + travelFee */
  total: number;
  serviceName: string;
  providerName: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paytotaPurchaseId?: string;
  paytotaReference?: string;
  sharedBookingToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderAvailability {
  id: string;
  providerId: string;
  weeklySlots: Partial<Record<Weekday, TimeRange[]>>;
  blackoutDates: string[];
  slotDurationMinutes: number;
  updatedAt: Date;
}

export interface ServiceReview {
  id: string;
  serviceId: string;
  providerId: string;
  bookingId?: string;
  rating: number;
  comment: string;
  customerName: string;
  isVisible: boolean;
  createdAt: Date;
}

export type ServiceSortMode = 'popular' | 'trending' | 'newest' | 'rating' | 'price_asc' | 'price_desc';

export type ServicePricePreset = 'all' | 'under-100k' | '100k-300k' | '300k-plus';

export const PROVIDER_APPROVAL_OPTIONS: {
  id: ProviderApprovalStatus;
  label: string;
}[] = [
  { id: 'pending', label: 'Pending approval' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'suspended', label: 'Suspended' },
];

export interface ServiceSearchFilters {
  query?: string;
  categoryId?: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  mobileOnly?: boolean;
  inStudioOnly?: boolean;
  sort?: ServiceSortMode;
}
