import { getFcmAdminApp, isFcmAdminConfigured } from '@/lib/fcm/admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isSupabaseAdminConfigured } from '@/lib/supabase/config';
import { TABLES } from '@/lib/supabase/tables';
import {
  ADMIN_MESSAGES_HREF,
  ADMIN_ORDERS_HREF,
  ADMIN_REVIEWS_HREF,
  ADMIN_SERVICE_BOOKINGS_HREF,
  ADMIN_SERVICE_PROVIDERS_HREF,
  ADMIN_SUPPLIERS_HREF,
  ADMIN_WHOLESALE_HREF,
  ADMIN_WHOLESALE_ORDERS_HREF,
  PROVIDER_HOME_HREF,
  SUPPLIER_HOME_HREF,
} from '@/lib/pwa/paths';

const MAX_TOKENS = 500;

type AlertPayload = {
  title: string;
  body: string;
  url: string;
  type:
    | 'order'
    | 'booking'
    | 'bulk_order'
    | 'wholesale_account'
    | 'supplier_approval'
    | 'provider_approval'
    | 'contact_message'
    | 'flagged_review'
    | 'admin_order'
    | 'admin_booking';
  tag?: string;
};

function uniqueTokens(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))].slice(0, MAX_TOKENS);
}

async function tokensForField(field: 'supplier_id' | 'provider_id', id: string): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const admin = getSupabaseAdmin();
  const { data } = await admin.from(TABLES.profiles).select('preferences, fcm_tokens').eq(field, id);
  const tokens: string[] = [];
  (data ?? []).forEach((row) => {
    const prefs = row.preferences as { pushAlerts?: boolean } | undefined;
    if (prefs?.pushAlerts === false) return;
    tokens.push(...uniqueTokens(row.fcm_tokens));
  });
  return [...new Set(tokens)];
}

async function tokensForAdmins(): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const admin = getSupabaseAdmin();
  const { data } = await admin.from(TABLES.profiles).select('preferences, fcm_tokens').eq('role', 'admin');
  const tokens: string[] = [];
  (data ?? []).forEach((row) => {
    const prefs = row.preferences as { pushAlerts?: boolean } | undefined;
    if (prefs?.pushAlerts === false) return;
    tokens.push(...uniqueTokens(row.fcm_tokens));
  });
  return [...new Set(tokens)].slice(0, MAX_TOKENS);
}

async function sendToTokens(tokens: string[], payload: AlertPayload): Promise<void> {
  if (tokens.length === 0 || !isFcmAdminConfigured()) return;
  const { getMessaging } = await import('firebase-admin/messaging');
  const messaging = getMessaging(getFcmAdminApp());
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
  if (!isSupabaseAdminConfigured() || !orderId) return;
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.from(TABLES.orders).select('*').eq('id', orderId).maybeSingle();
    if (!data) return;

    const supplierIds = Array.isArray(data.supplier_ids)
      ? data.supplier_ids.map(String).filter(Boolean)
      : [];
    if (supplierIds.length === 0) return;

    const tokenSets = await Promise.all(
      supplierIds.map((id: string) => tokensForField('supplier_id', id))
    );
    const tokens = [...new Set(tokenSets.flat())];
    const customer = String(data.customer_name || 'A customer');
    const total = Number(data.total ?? 0);
    await sendToTokens(tokens, {
      type: 'order',
      title: 'New ShiQueen order',
      body: `${customer} placed an order${total > 0 ? ` · UGX ${total.toLocaleString('en-UG')}` : ''}`,
      url: SUPPLIER_HOME_HREF,
    });
  } catch (error) {
    console.warn('[ShiQueen] Partner order alert failed:', error);
  }
}

export async function notifyPartnerBooking(bookingId: string): Promise<void> {
  if (!isSupabaseAdminConfigured() || !bookingId) return;
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from(TABLES.serviceBookings)
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();
    if (!data) return;
    if (String(data.payment_status ?? '') !== 'paid') return;

    const providerId = String(data.provider_id ?? '');
    if (!providerId) return;
    const tokens = await tokensForField('provider_id', providerId);
    const customer = String(data.customer_name || 'A customer');
    const serviceName = String(data.service_name || 'a service');
    await sendToTokens(tokens, {
      type: 'booking',
      title: 'New ShiQueen booking',
      body: `${customer} booked ${serviceName}`,
      url: `${PROVIDER_HOME_HREF}/${bookingId}`,
    });
  } catch (error) {
    console.warn('[ShiQueen] Partner booking alert failed:', error);
  }
}

export async function notifyAdminApprovalRequest(
  kind: 'supplier' | 'provider',
  id: string
): Promise<void> {
  if (!isSupabaseAdminConfigured() || !id) return;
  try {
    const admin = getSupabaseAdmin();
    const table = kind === 'supplier' ? TABLES.suppliers : TABLES.serviceProviders;
    const { data } = await admin.from(table).select('*').eq('id', id).maybeSingle();
    if (!data) return;
    if (String(data.approval_status ?? '') !== 'pending') return;

    const tokens = await tokensForAdmins();
    const name =
      kind === 'supplier'
        ? String(data.company_name || data.name || 'A supplier')
        : String(data.business_name || data.name || 'A provider');
    const url = kind === 'supplier' ? ADMIN_SUPPLIERS_HREF : ADMIN_SERVICE_PROVIDERS_HREF;
    await sendToTokens(tokens, {
      type: kind === 'supplier' ? 'supplier_approval' : 'provider_approval',
      title: kind === 'supplier' ? 'New supplier approval request' : 'New provider approval request',
      body: `${name} is waiting for approval`,
      url,
      tag: `approval-${kind}-${id}`,
    });
  } catch (error) {
    console.warn('[ShiQueen] Admin approval alert failed:', error);
  }
}

export async function notifyAdminContactMessage(id: string): Promise<void> {
  if (!isSupabaseAdminConfigured() || !id) return;
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from(TABLES.contactMessages)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!data) return;

    const tokens = await tokensForAdmins();
    const name = String(data.name || 'Someone');
    const subject = String(data.subject || 'New contact message');
    const topic = String(data.topic || '');
    const isAdRequest = topic === 'advertise';
    await sendToTokens(tokens, {
      type: 'contact_message',
      title: isAdRequest ? 'New advertising request' : 'New contact message',
      body: `${name}: ${subject}`,
      url: `${ADMIN_MESSAGES_HREF}?id=${encodeURIComponent(id)}`,
      tag: `contact-${id}`,
    });
  } catch (error) {
    console.warn('[ShiQueen] Admin contact message alert failed:', error);
  }
}

export async function notifyAdminFlaggedReview(id: string): Promise<void> {
  if (!isSupabaseAdminConfigured() || !id) return;
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from(TABLES.productReviews)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!data) return;
    if (String(data.flag_status ?? '') !== 'pending') return;

    const tokens = await tokensForAdmins();
    const customer = String(data.customer_name || 'A customer');
    const reason = String(data.flag_reason || 'review');
    const title = String(data.title || '').trim();
    const comment = String(data.comment || '').trim();
    const snippet = title || comment.slice(0, 80) || 'A product review';
    await sendToTokens(tokens, {
      type: 'flagged_review',
      title: 'Product review flagged',
      body: `${customer}: ${snippet}${reason ? ` · ${reason.replace(/_/g, ' ')}` : ''}`,
      url: ADMIN_REVIEWS_HREF,
      tag: `review-flag-${id}`,
    });
  } catch (error) {
    console.warn('[ShiQueen] Admin flagged review alert failed:', error);
  }
}

export async function notifyAdminOrder(orderId: string): Promise<void> {
  if (!isSupabaseAdminConfigured() || !orderId) return;
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.from(TABLES.orders).select('*').eq('id', orderId).maybeSingle();
    if (!data) return;

    const tokens = await tokensForAdmins();
    const customer = String(data.customer_name || 'A customer');
    const total = Number(data.total ?? 0);
    const orderType = String(data.order_type || 'retail');
    await sendToTokens(tokens, {
      type: 'admin_order',
      title: 'New ShiQueen order',
      body: `${customer} placed a ${orderType} order${total > 0 ? ` · UGX ${total.toLocaleString('en-UG')}` : ''}`,
      url: ADMIN_ORDERS_HREF,
      tag: `admin-order-${orderId}`,
    });
  } catch (error) {
    console.warn('[ShiQueen] Admin order alert failed:', error);
  }
}

export async function notifyAdminBooking(bookingId: string): Promise<void> {
  if (!isSupabaseAdminConfigured() || !bookingId) return;
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from(TABLES.serviceBookings)
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();
    if (!data) return;

    const tokens = await tokensForAdmins();
    const customer = String(data.customer_name || 'A customer');
    const serviceName = String(data.service_name || 'a service');
    await sendToTokens(tokens, {
      type: 'admin_booking',
      title: 'New service booking',
      body: `${customer} booked ${serviceName}`,
      url: ADMIN_SERVICE_BOOKINGS_HREF,
      tag: `admin-booking-${bookingId}`,
    });
  } catch (error) {
    console.warn('[ShiQueen] Admin booking alert failed:', error);
  }
}

export async function notifyAdminBulkOrder(orderId: string): Promise<void> {
  if (!isSupabaseAdminConfigured() || !orderId) return;
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.from(TABLES.bulkOrders).select('*').eq('id', orderId).maybeSingle();
    if (!data) return;
    if (String(data.status ?? '') !== 'pending') return;

    const tokens = await tokensForAdmins();
    const total = Number(data.total_amount ?? 0);
    const itemCount = Array.isArray(data.items) ? data.items.length : 0;
    await sendToTokens(tokens, {
      type: 'bulk_order',
      title: 'New wholesale order',
      body: `Bulk order with ${itemCount} line${itemCount === 1 ? '' : 's'}${total > 0 ? ` · UGX ${total.toLocaleString('en-UG')}` : ''}`,
      url: ADMIN_WHOLESALE_ORDERS_HREF,
      tag: `bulk-order-${orderId}`,
    });
  } catch (error) {
    console.warn('[ShiQueen] Admin bulk order alert failed:', error);
  }
}

export async function notifyAdminWholesaleAccount(accountId: string): Promise<void> {
  if (!isSupabaseAdminConfigured() || !accountId) return;
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from(TABLES.wholesaleAccounts)
      .select('*')
      .eq('id', accountId)
      .maybeSingle();
    if (!data) return;
    if (String(data.status ?? '') !== 'pending') return;

    const tokens = await tokensForAdmins();
    const business = String(data.company_name || 'A business');
    await sendToTokens(tokens, {
      type: 'wholesale_account',
      title: 'New wholesale application',
      body: `${business} applied for a wholesale account`,
      url: ADMIN_WHOLESALE_HREF,
      tag: `wholesale-account-${accountId}`,
    });
  } catch (error) {
    console.warn('[ShiQueen] Admin wholesale account alert failed:', error);
  }
}
