import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { stripUndefined } from '@/lib/firebase/sanitize';
import { toDate } from '@/lib/firebase/timestamp';
import { Order, ShippingAddress, OrderItem } from '@/lib/types/database';

function mapOrder(id: string, data: Record<string, unknown>): Order {
  return {
    id,
    userId: data.userId ? String(data.userId) : null,
    customerName: String(data.customerName ?? ''),
    email: String(data.email ?? ''),
    items: Array.isArray(data.items) ? (data.items as OrderItem[]) : [],
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
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function createOrder(
  order: Omit<Order, 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  const { id, ...data } = order;
  await setDoc(doc(db, COLLECTIONS.orders, id), {
    ...stripUndefined(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
}

export async function getOrder(id: string): Promise<Order | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const snap = await getDoc(doc(db, COLLECTIONS.orders, id));
  if (!snap.exists()) return null;
  return mapOrder(snap.id, snap.data());
}

export async function getOrders(): Promise<Order[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.orders), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((docSnap) => mapOrder(docSnap.id, docSnap.data()));
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.orders), where('userId', '==', userId))
  );
  return snapshot.docs
    .map((docSnap) => mapOrder(docSnap.id, docSnap.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function subscribeOrders(
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.orders), orderBy('createdAt', 'desc')),
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => mapOrder(docSnap.id, docSnap.data())));
    },
    (error) => onError?.(error)
  );
}

export function subscribeUserOrders(
  userId: string,
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, COLLECTIONS.orders), where('userId', '==', userId)),
    (snapshot) => {
      const orders = snapshot.docs
        .map((docSnap) => mapOrder(docSnap.id, docSnap.data()))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(orders);
    },
    (error) => onError?.(error)
  );
}

export async function updateOrderStatus(
  id: string,
  status: Order['status']
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase not initialized');

  await updateDoc(doc(db, COLLECTIONS.orders, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeOrder(
  id: string,
  onData: (order: Order | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    onData(null);
    return () => {};
  }

  return onSnapshot(
    doc(db, COLLECTIONS.orders, id),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapOrder(snap.id, snap.data()));
    },
    (error) => onError?.(error)
  );
}

export { generateOrderId } from '@/lib/order-utils';
