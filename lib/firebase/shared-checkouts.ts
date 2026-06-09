import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { stripUndefined } from '@/lib/firebase/sanitize';
import { resolveSharedCheckoutStatus } from '@/lib/shared-checkout-utils';
import type { SharedCheckout } from '@/lib/types/shared-checkout';
import type { CartItem } from '@/lib/cart-context';
import type { OrderItem, ShippingAddress } from '@/lib/types/database';

export type CreateClientSharedCheckoutInput = {
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

function toDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as Timestamp).toDate();
  }
  if (typeof value === 'string') return new Date(value);
  return new Date();
}

function mapSharedCheckoutDoc(id: string, data: Record<string, unknown>): SharedCheckout {
  const createdAt = toDate(data.createdAt);
  const expiresAt = toDate(data.expiresAt);
  const paidAt = data.paidAt ? toDate(data.paidAt) : undefined;

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
  input: CreateClientSharedCheckoutInput
): Promise<SharedCheckout> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not initialized.');

  const { id, expiresAt, ...data } = input;

  await setDoc(doc(db, COLLECTIONS.sharedCheckouts, id), {
    ...stripUndefined(data),
    status: 'pending',
    expiresAt,
    createdAt: serverTimestamp(),
  });

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
  const db = getFirebaseDb();
  if (!db) return null;

  const snap = await getDoc(doc(db, COLLECTIONS.sharedCheckouts, token));
  if (!snap.exists()) return null;

  const checkout = mapSharedCheckoutDoc(snap.id, snap.data());
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
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not initialized.');

  const ref = doc(db, COLLECTIONS.sharedCheckouts, token);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return 'not_found';

    const checkout = mapSharedCheckoutDoc(snap.id, snap.data()!);
    const status = resolveSharedCheckoutStatus(checkout);

    if (status === 'paid') return 'paid';
    if (status === 'expired') return 'expired';
    if (checkout.orderId) return 'in_progress';

    transaction.update(ref, { orderId });
    return 'reserved';
  });
}

export async function markSharedCheckoutPaid(token: string, orderId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not initialized.');

  const ref = doc(db, COLLECTIONS.sharedCheckouts, token);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    transaction.update(ref, {
      status: 'paid',
      orderId,
      paidAt: serverTimestamp(),
    });
  });
}
