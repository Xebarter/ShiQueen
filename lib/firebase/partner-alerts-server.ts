import { getAdminApp, getAdminDb } from '@/lib/firebase/admin';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin-config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import {
  ADMIN_SERVICE_PROVIDERS_HREF,
  ADMIN_SUPPLIERS_HREF,
  PROVIDER_HOME_HREF,
  SUPPLIER_HOME_HREF,
} from '@/lib/pwa/paths';

const MAX_TOKENS = 500;

type AlertPayload = {
  title: string;
  body: string;
  url: string;
  type: 'order' | 'booking' | 'supplier_approval' | 'provider_approval';
  tag?: string;
};

function uniqueTokens(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))].slice(0, MAX_TOKENS);
}

async function tokensForField(field: 'supplierId' | 'providerId', id: string): Promise<string[]> {
  const db = await getAdminDb();
  const snap = await db.collection(COLLECTIONS.users).where(field, '==', id).get();
  const tokens: string[] = [];
  snap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const prefs = data.preferences as { pushAlerts?: boolean } | undefined;
    if (prefs?.pushAlerts === false) return;
    tokens.push(...uniqueTokens(data.fcmTokens));
  });
  return [...new Set(tokens)];
}

async function tokensForAdmins(): Promise<string[]> {
  const db = await getAdminDb();
  const snap = await db.collection(COLLECTIONS.users).where('role', '==', 'admin').get();
  const tokens: string[] = [];
  snap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const prefs = data.preferences as { pushAlerts?: boolean } | undefined;
    if (prefs?.pushAlerts === false) return;
    tokens.push(...uniqueTokens(data.fcmTokens));
  });
  return [...new Set(tokens)].slice(0, MAX_TOKENS);
}

async function sendToTokens(tokens: string[], payload: AlertPayload): Promise<void> {
  if (tokens.length === 0) return;
  const { getMessaging } = await import('firebase-admin/messaging');
  const messaging = getMessaging(getAdminApp());
  await messaging.sendEachForMulticast({
    tokens,
    data: {
      title: payload.title,
      body: payload.body,
      url: payload.url,
      type: payload.type,
      tag: payload.tag ?? payload.type,
    },
    webpush: {
      fcmOptions: { link: payload.url },
    },
  });
}

export async function notifyPartnerOrder(orderId: string): Promise<void> {
  if (!isFirebaseAdminConfigured() || !orderId) return;
  try {
    const db = await getAdminDb();
    const snap = await db.collection(COLLECTIONS.orders).doc(orderId).get();
    if (!snap.exists) return;
    const data = snap.data() ?? {};
    const supplierIds = Array.isArray(data.supplierIds)
      ? data.supplierIds.map(String).filter(Boolean)
      : [];
    if (supplierIds.length === 0) return;

    const tokenSets = await Promise.all(
      supplierIds.map((id) => tokensForField('supplierId', id))
    );
    const tokens = [...new Set(tokenSets.flat())];
    const customer = String(data.customerName || 'A customer');
    const total = Number(data.total ?? 0);
    await sendToTokens(tokens, {
      type: 'order',
      title: 'New SheQueen order',
      body: `${customer} placed an order${total > 0 ? ` · UGX ${total.toLocaleString('en-UG')}` : ''}`,
      url: SUPPLIER_HOME_HREF,
    });
  } catch (error) {
    console.warn('[SheQueen] Partner order alert failed:', error);
  }
}

export async function notifyPartnerBooking(bookingId: string): Promise<void> {
  if (!isFirebaseAdminConfigured() || !bookingId) return;
  try {
    const db = await getAdminDb();
    const snap = await db.collection(COLLECTIONS.serviceBookings).doc(bookingId).get();
    if (!snap.exists) return;
    const data = snap.data() ?? {};
    const providerId = String(data.providerId ?? '');
    if (!providerId) return;
    const tokens = await tokensForField('providerId', providerId);
    const customer = String(data.customerName || 'A customer');
    const serviceName = String(data.serviceName || 'a service');
    await sendToTokens(tokens, {
      type: 'booking',
      title: 'New SheQueen booking',
      body: `${customer} booked ${serviceName}`,
      url: `${PROVIDER_HOME_HREF}/${bookingId}`,
    });
  } catch (error) {
    console.warn('[SheQueen] Partner booking alert failed:', error);
  }
}

export async function notifyAdminApprovalRequest(
  kind: 'supplier' | 'provider',
  id: string
): Promise<void> {
  if (!isFirebaseAdminConfigured() || !id) return;
  try {
    const db = await getAdminDb();
    const collectionName =
      kind === 'supplier' ? COLLECTIONS.suppliers : COLLECTIONS.serviceProviders;
    const snap = await db.collection(collectionName).doc(id).get();
    if (!snap.exists) return;
    const data = snap.data() ?? {};
    if (String(data.approvalStatus ?? '') !== 'pending') return;

    const tokens = await tokensForAdmins();
    const name =
      kind === 'supplier'
        ? String(data.companyName || data.name || 'A supplier')
        : String(data.businessName || data.name || 'A provider');
    const url = kind === 'supplier' ? ADMIN_SUPPLIERS_HREF : ADMIN_SERVICE_PROVIDERS_HREF;
    await sendToTokens(tokens, {
      type: kind === 'supplier' ? 'supplier_approval' : 'provider_approval',
      title: kind === 'supplier' ? 'New supplier approval request' : 'New provider approval request',
      body: `${name} is waiting for approval`,
      url,
      tag: `approval-${kind}-${id}`,
    });
  } catch (error) {
    console.warn('[SheQueen] Admin approval alert failed:', error);
  }
}
