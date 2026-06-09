import { COLLECTIONS } from '@/lib/firebase/collections';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { stripUndefined } from '@/lib/firebase/sanitize';
import { resolveSharedCheckoutStatus } from '@/lib/shared-checkout-utils';
import type { SharedCheckout } from '@/lib/types/shared-checkout';
import type { CartItem } from '@/lib/cart-context';
import type { OrderItem, ShippingAddress } from '@/lib/types/database';

export type CreateSharedCheckoutInput = {
  id: string;
  cartItems: CartItem[];
  orderItems: OrderItem[];
  subtotal: number;
  total: number;
  orderType: SharedCheckout['orderType'];
  recipientName: string;
  shippingAddress: ShippingAddress;
  senderUserId?: string | null;
  senderMessage?: string;
  expiresAt: Date;
};

function mapSharedCheckoutDoc(
  id: string,
  data: FirebaseFirestore.DocumentData
): SharedCheckout {
  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  const expiresAt = data.expiresAt?.toDate?.() ?? createdAt;
  const paidAt = data.paidAt?.toDate?.();

  return {
    id,
    status: (data.status as SharedCheckout['status']) ?? 'pending',
    cartItems: Array.isArray(data.cartItems) ? (data.cartItems as CartItem[]) : [],
    orderItems: Array.isArray(data.orderItems) ? (data.orderItems as OrderItem[]) : [],
    subtotal: Number(data.subtotal ?? 0),
    total: Number(data.total ?? 0),
    orderType: (data.orderType as SharedCheckout['orderType']) ?? 'retail',
    recipientName: String(data.recipientName ?? ''),
    shippingAddress: data.shippingAddress as ShippingAddress,
    senderUserId: data.senderUserId ? String(data.senderUserId) : null,
    senderMessage: data.senderMessage ? String(data.senderMessage) : undefined,
    orderId: data.orderId ? String(data.orderId) : undefined,
    expiresAt,
    createdAt,
    paidAt,
  };
}

export async function createSharedCheckout(
  input: CreateSharedCheckoutInput
): Promise<SharedCheckout> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Shared checkout requires FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const [{ FieldValue }, { getAdminDb }] = await Promise.all([
    import('firebase-admin/firestore'),
    import('@/lib/firebase/admin'),
  ]);

  const db = await getAdminDb();
  const { id, expiresAt, ...data } = input;

  const payload = {
    ...stripUndefined(data),
    status: 'pending' as const,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection(COLLECTIONS.sharedCheckouts).doc(id).set(payload);

  return {
    id,
    status: 'pending',
    cartItems: input.cartItems,
    orderItems: input.orderItems,
    subtotal: input.subtotal,
    total: input.total,
    orderType: input.orderType,
    recipientName: input.recipientName,
    shippingAddress: input.shippingAddress,
    senderUserId: input.senderUserId ?? null,
    senderMessage: input.senderMessage,
    expiresAt: input.expiresAt,
    createdAt: new Date(),
  };
}

export async function getSharedCheckoutById(token: string): Promise<SharedCheckout | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const { getAdminDb } = await import('@/lib/firebase/admin');
  const snap = await (await getAdminDb())
    .collection(COLLECTIONS.sharedCheckouts)
    .doc(token)
    .get();

  if (!snap.exists) return null;

  const checkout = mapSharedCheckoutDoc(snap.id, snap.data()!);
  const resolvedStatus = resolveSharedCheckoutStatus(checkout);

  if (resolvedStatus === 'expired' && checkout.status === 'pending') {
    return { ...checkout, status: 'expired' };
  }

  return { ...checkout, status: resolvedStatus };
}

export async function reserveSharedCheckoutForPayment(
  token: string,
  orderId: string
): Promise<'reserved' | 'paid' | 'expired' | 'in_progress' | 'not_found'> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Shared checkout updates require FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const { getAdminDb } = await import('@/lib/firebase/admin');
  const db = await getAdminDb();
  const ref = db.collection(COLLECTIONS.sharedCheckouts).doc(token);

  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) return 'not_found';

    const checkout = mapSharedCheckoutDoc(snap.id, snap.data()!);
    const status = resolveSharedCheckoutStatus(checkout);

    if (status === 'paid') return 'paid';
    if (status === 'expired') return 'expired';
    if (checkout.orderId) return 'in_progress';

    transaction.update(ref, { orderId });
    return 'reserved';
  });
}

export async function markSharedCheckoutPaidByOrderId(orderId: string): Promise<void> {
  if (!isFirebaseAdminConfigured()) return;

  const { getAdminDb } = await import('@/lib/firebase/admin');
  const db = await getAdminDb();

  const snap = await db
    .collection(COLLECTIONS.sharedCheckouts)
    .where('orderId', '==', orderId)
    .limit(1)
    .get();

  if (snap.empty) return;

  const doc = snap.docs[0]!;
  await markSharedCheckoutPaid(doc.id, orderId);
}

export async function markSharedCheckoutPaid(
  token: string,
  orderId: string
): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Shared checkout updates require FIREBASE_SERVICE_ACCOUNT_JSON.');
  }

  const [{ FieldValue }, { getAdminDb }] = await Promise.all([
    import('firebase-admin/firestore'),
    import('@/lib/firebase/admin'),
  ]);

  await (await getAdminDb()).collection(COLLECTIONS.sharedCheckouts).doc(token).update({
    status: 'paid',
    orderId,
    paidAt: FieldValue.serverTimestamp(),
  });
}
