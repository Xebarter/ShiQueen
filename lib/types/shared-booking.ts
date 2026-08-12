import type { ServiceLocationType } from '@/lib/types/services';

export type SharedBookingStatus = 'pending' | 'paid' | 'expired';

export interface SharedBookingSnapshot {
  serviceId: string;
  providerId: string;
  serviceName: string;
  providerName: string;
  date: string;
  timeSlot: string;
  locationType: ServiceLocationType;
  customerAddress?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  amount: number;
  travelFee: number;
  total: number;
  durationMinutes?: number;
  galleryImage?: string;
}

export interface SharedBooking {
  id: string;
  status: SharedBookingStatus;
  bookingId: string;
  snapshot: SharedBookingSnapshot;
  senderUserId?: string | null;
  senderMessage?: string;
  expiresAt: Date;
  createdAt: Date;
  paidAt?: Date;
}

export interface SharedBookingPublicView {
  token: string;
  status: SharedBookingStatus;
  bookingId: string;
  recipientFirstName: string;
  serviceName: string;
  providerName: string;
  date: string;
  timeSlot: string;
  locationType: ServiceLocationType;
  locationLabel: string;
  amount: number;
  travelFee: number;
  total: number;
  durationMinutes?: number;
  galleryImage?: string;
  senderMessage?: string;
  expiresAt: string;
}
