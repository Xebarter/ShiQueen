import { COLLECTIONS } from '@/lib/firebase/collections';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { stripUndefined } from '@/lib/firebase/sanitize';
import type { Order, OrderItem, ShippingAddress } from '@/lib/types/database';

export type CreateServerOrderInput = {
  id: string;
  userId: string | null;
  customerName: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: ShippingAddress;
  orderType: Order['orderType'];
  paymentMethod: Order['paymentMethod'];
  paymentStatus: Order['paymentStatus'];
  paytotaPurchaseId?: string;
  paytotaReference?: string;
};

export type PaymentUpdateInput = {
  paymentStatus?: Order['paymentStatus'];
  paytotaPurchaseId?: string;
  paytotaReference?: string;
  status?: Order['status'];
};

function mapOrderDoc(id: string, data: FirebaseFirestore.DocumentData): Order {
  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  const updatedAt = data.updatedAt?.toDate?.() ?? createdAt;

  return {
    id,
    userId: data.userId ? String(data.userId) : null,
    customerName: String(data.customerName ?? ''),
    email: String(data.email ?? ''),
    items: Array.isArray(data.items) ? (data.items as Order['items']) : [],
    subtotal: Number(data.subtotal ?? 0),
    tax: Number(data.tax ?? 0),
    total: Number(data.total ?? 0),
    shippingAddress: data.shippingAddress as ShippingAddress,
    status: (data.status as Order['status']) ?? 'pending',
    orderType: (data.orderType as Order['orderType']) ?? 'retail',
    paymentMethod: data.paymentMethod as Order['paymentMethod'],
    paymentStatus: data.paymentStatus as Order['paymentStatus'],
    paytotaPurchaseId: data.paytotaPurchaseId ? String(data.paytotaPurchaseId) : undefined,
    paytotaReference: data.paytotaReference ? String(data.paytotaReference) : undefined,
    createdAt,
    updatedAt,
  };
}

export async function createOrderServer(order: CreateServerOrderInput): Promise<string> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Server order creation requires FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const [{ FieldValue }, { getAdminDb }] = await Promise.all([
    import('firebase-admin/firestore'),
    import('@/lib/firebase/admin'),
  ]);

  const db = await getAdminDb();
  const { id, ...data } = order;

  await db.collection(COLLECTIONS.orders).doc(id).set({
    ...stripUndefined({ ...data, status: 'pending' }),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return id;
}

export async function getOrderServer(id: string): Promise<Order | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const { getAdminDb } = await import('@/lib/firebase/admin');
  const snap = await (await getAdminDb()).collection(COLLECTIONS.orders).doc(id).get();
  if (!snap.exists) return null;
  return mapOrderDoc(snap.id, snap.data()!);
}

export async function getOrderByPaytotaReference(reference: string): Promise<Order | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const { getAdminDb } = await import('@/lib/firebase/admin');
  const db = await getAdminDb();

  const byRef = await db
    .collection(COLLECTIONS.orders)
    .where('paytotaReference', '==', reference)
    .limit(1)
    .get();

  if (!byRef.empty) {
    const doc = byRef.docs[0]!;
    return mapOrderDoc(doc.id, doc.data());
  }

  const byId = await db.collection(COLLECTIONS.orders).doc(reference).get();
  if (byId.exists) {
    return mapOrderDoc(byId.id, byId.data()!);
  }

  return null;
}

export async function updateOrderPaymentServer(
  orderId: string,
  updates: PaymentUpdateInput
): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Server order updates require FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const [{ FieldValue }, { getAdminDb }] = await Promise.all([
    import('firebase-admin/firestore'),
    import('@/lib/firebase/admin'),
  ]);

  await (await getAdminDb())
    .collection(COLLECTIONS.orders)
    .doc(orderId)
    .update({
      ...stripUndefined(updates),
      updatedAt: FieldValue.serverTimestamp(),
    });
}
