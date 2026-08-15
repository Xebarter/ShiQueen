import { getFcmAdminApp, isFcmAdminConfigured } from '@/lib/fcm/admin';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isSupabaseAdminConfigured } from '@/lib/supabase/config';
import { TABLES } from '@/lib/supabase/tables';
import {
  ADMIN_MESSAGES_HREF,
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
  type: 'order' | 'booking' | 'supplier_approval' | 'provider_approval' | 'contact_message';
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
    await sendToTokens(tokens, {
      type: 'contact_message',
      title: 'New contact message',
      body: `${name}: ${subject}`,
      url: `${ADMIN_MESSAGES_HREF}?id=${encodeURIComponent(id)}`,
      tag: `contact-${id}`,
    });
  } catch (error) {
    console.warn('[ShiQueen] Admin contact message alert failed:', error);
  }
}
