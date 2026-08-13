import { COLLECTIONS } from '@/lib/firebase/collections';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { stripUndefined } from '@/lib/firebase/sanitize';
import type { ServiceBooking, ServiceBookingStatus, ServiceLocationType } from '@/lib/types/services';
import type { PaymentMethod, PaymentStatus } from '@/lib/types/database';

export type CreateServerBookingInput = {
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
  amount: number;
  travelFee: number;
  total: number;
  serviceName: string;
  providerName: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paytotaPurchaseId?: string;
  paytotaReference?: string;
  sharedBookingToken?: string;
};

export type BookingPaymentUpdateInput = {
  paymentStatus?: PaymentStatus;
  paytotaPurchaseId?: string;
  paytotaReference?: string;
  status?: ServiceBookingStatus;
};

function mapBookingDoc(id: string, data: FirebaseFirestore.DocumentData): ServiceBooking {
  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  const updatedAt = data.updatedAt?.toDate?.() ?? createdAt;

  return {
    id,
    serviceId: String(data.serviceId ?? ''),
    providerId: String(data.providerId ?? ''),
    userId: data.userId ? String(data.userId) : null,
    customerName: String(data.customerName ?? ''),
    customerPhone: String(data.customerPhone ?? ''),
    customerEmail: data.customerEmail ? String(data.customerEmail) : undefined,
    date: String(data.date ?? ''),
    timeSlot: String(data.timeSlot ?? ''),
    locationType: (data.locationType as ServiceLocationType) ?? 'studio',
    customerAddress: data.customerAddress ? String(data.customerAddress) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
    status: (data.status as ServiceBookingStatus) ?? 'pending',
    amount: Number(data.amount ?? 0),
    travelFee: Number(data.travelFee ?? 0),
    total: Number(data.total ?? data.amount ?? 0),
    serviceName: String(data.serviceName ?? ''),
    providerName: String(data.providerName ?? ''),
    paymentMethod: data.paymentMethod as PaymentMethod | undefined,
    paymentStatus: data.paymentStatus as PaymentStatus | undefined,
    paytotaPurchaseId: data.paytotaPurchaseId ? String(data.paytotaPurchaseId) : undefined,
    paytotaReference: data.paytotaReference ? String(data.paytotaReference) : undefined,
    sharedBookingToken: data.sharedBookingToken
      ? String(data.sharedBookingToken)
      : undefined,
    createdAt,
    updatedAt,
  };
}

export async function createServiceBookingServer(
  booking: CreateServerBookingInput
): Promise<string> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Server booking creation requires FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const [{ FieldValue }, { getAdminDb }] = await Promise.all([
    import('firebase-admin/firestore'),
    import('@/lib/firebase/admin'),
  ]);

  const db = await getAdminDb();
  const { id, ...data } = booking;

  await db.collection(COLLECTIONS.serviceBookings).doc(id).set({
    ...stripUndefined(data),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  void import('@/lib/firebase/partner-alerts-server').then(({ notifyPartnerBooking }) =>
    notifyPartnerBooking(id)
  );

  return id;
}

export async function getServiceBookingServer(id: string): Promise<ServiceBooking | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const { getAdminDb } = await import('@/lib/firebase/admin');
  const snap = await (await getAdminDb()).collection(COLLECTIONS.serviceBookings).doc(id).get();
  if (!snap.exists) return null;
  return mapBookingDoc(snap.id, snap.data()!);
}

export async function getServiceBookingByPaytotaReference(
  reference: string
): Promise<ServiceBooking | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const { getAdminDb } = await import('@/lib/firebase/admin');
  const db = await getAdminDb();

  const byRef = await db
    .collection(COLLECTIONS.serviceBookings)
    .where('paytotaReference', '==', reference)
    .limit(1)
    .get();

  if (!byRef.empty) {
    const doc = byRef.docs[0]!;
    return mapBookingDoc(doc.id, doc.data());
  }

  const byId = await db.collection(COLLECTIONS.serviceBookings).doc(reference).get();
  if (byId.exists) {
    return mapBookingDoc(byId.id, byId.data()!);
  }

  return null;
}

export async function updateServiceBookingPaymentServer(
  bookingId: string,
  updates: BookingPaymentUpdateInput
): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Server booking updates require FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const [{ FieldValue }, { getAdminDb }] = await Promise.all([
    import('firebase-admin/firestore'),
    import('@/lib/firebase/admin'),
  ]);

  await (await getAdminDb())
    .collection(COLLECTIONS.serviceBookings)
    .doc(bookingId)
    .set(
      {
        ...stripUndefined(updates),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function getBookedSlotsForProviderDateServer(
  providerId: string,
  date: string
): Promise<string[]> {
  if (!isFirebaseAdminConfigured()) return [];

  const { getAdminDb } = await import('@/lib/firebase/admin');
  const db = await getAdminDb();

  const snap = await db
    .collection(COLLECTIONS.serviceBookings)
    .where('providerId', '==', providerId)
    .where('date', '==', date)
    .get();

  const blocking = new Set(['pending', 'confirmed', 'in_progress', 'awaiting_payment']);

  return snap.docs
    .map((d) => d.data())
    .filter((data) => {
      const status = String(data.status ?? '');
      const paymentStatus = String(data.paymentStatus ?? '');
      if (status === 'cancelled') return false;
      if (paymentStatus === 'failed' || paymentStatus === 'cancelled') return false;
      return (
        blocking.has(status) ||
        paymentStatus === 'awaiting_payment' ||
        paymentStatus === 'paid'
      );
    })
    .map((data) => String(data.timeSlot ?? ''))
    .filter(Boolean);
}
