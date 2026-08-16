import type { UserRole } from '@/lib/types/database';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/supabase/tables';

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  photo_url: string | null;
  role: UserRole;
  supplier_id: string | null;
  provider_id: string | null;
  preferences: unknown;
  default_address: unknown;
  fcm_tokens: string[] | null;
  created_at: string;
};

const ROLE_RANK: Record<UserRole, number> = {
  customer: 0,
  supplier: 1,
  service_provider: 1,
  admin: 2,
};

function adminEmails(): string[] {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function pickRole(email: string, current: ProfileRow | null, donor: ProfileRow | null): UserRole {
  if (adminEmails().includes(email.toLowerCase())) return 'admin';
  const donorRole = donor?.role ?? 'customer';
  const currentRole = current?.role ?? 'customer';
  if (ROLE_RANK[donorRole] >= ROLE_RANK[currentRole]) {
    if (donorRole === 'customer' && (donor?.supplier_id || current?.supplier_id)) {
      return 'supplier';
    }
    if (donorRole === 'customer' && (donor?.provider_id || current?.provider_id)) {
      return 'service_provider';
    }
    return donorRole;
  }
  return currentRole;
}

function pickText(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

async function reassign(
  table: string,
  column: string,
  fromIds: string[],
  toId: string
): Promise<void> {
  const admin = getSupabaseAdmin();
  for (const fromId of fromIds) {
    if (!fromId || fromId === toId) continue;
    const { error } = await admin.from(table).update({ [column]: toId }).eq(column, fromId);
    if (error) {
      console.warn(`[relink-profile] ${table}.${column} ${fromId} → ${toId}`, error.message);
    }
  }
}

/**
 * Copy role / shop / provider from a pre-Firebase-switch profile onto the new UID.
 * Matches by email because Google sign-in issued a new Firebase uid.
 */
export async function relinkProfileByEmail(uid: string, email: string, displayName?: string, photoURL?: string) {
  const admin = getSupabaseAdmin();
  const normalized = email.trim().toLowerCase();
  if (!uid || !normalized) {
    return { relinked: false as const };
  }

  const { data, error } = await admin.from(TABLES.profiles).select('*').ilike('email', normalized);
  if (error) throw error;

  const rows = (data ?? []) as ProfileRow[];
  const current = rows.find((row) => row.id === uid) ?? null;
  const donors = rows
    .filter((row) => row.id !== uid)
    .sort((a, b) => ROLE_RANK[b.role] - ROLE_RANK[a.role] || a.created_at.localeCompare(b.created_at));
  const donor = donors[0] ?? null;

  if (!current && !donor) {
    return { relinked: false as const };
  }

  const role = pickRole(normalized, current, donor);
  const supplierId = pickText(current?.supplier_id, donor?.supplier_id);
  const providerId = pickText(current?.provider_id, donor?.provider_id);
  const payload = {
    id: uid,
    email: normalized,
    display_name: pickText(displayName, current?.display_name, donor?.display_name),
    phone: pickText(current?.phone, donor?.phone),
    photo_url: pickText(photoURL, current?.photo_url, donor?.photo_url),
    role,
    supplier_id: supplierId,
    provider_id: providerId,
    preferences: current?.preferences ?? donor?.preferences ?? null,
    default_address: current?.default_address ?? donor?.default_address ?? null,
    fcm_tokens: [...new Set([...(current?.fcm_tokens ?? []), ...(donor?.fcm_tokens ?? [])])],
  };

  if (current) {
    const { error: updateError } = await admin.from(TABLES.profiles).update(payload).eq('id', uid);
    if (updateError) throw updateError;
  } else {
    const insertRole = role === 'admin' ? 'customer' : role;
    const { error: insertError } = await admin.from(TABLES.profiles).insert({ ...payload, role: insertRole });
    if (insertError) throw insertError;
    if (role === 'admin') {
      const { error: promoteError } = await admin.from(TABLES.profiles).update({ role: 'admin' }).eq('id', uid);
      if (promoteError) throw promoteError;
    }
  }

  const oldIds = donors.map((row) => row.id);
  if (oldIds.length > 0) {
    await reassign(TABLES.suppliers, 'owner_uid', oldIds, uid);
    await reassign(TABLES.serviceProviders, 'owner_uid', oldIds, uid);
    await reassign(TABLES.orders, 'user_id', oldIds, uid);
    await reassign(TABLES.bulkOrders, 'customer_id', oldIds, uid);
    await reassign(TABLES.wholesaleAccounts, 'customer_id', oldIds, uid);
    await reassign(TABLES.serviceBookings, 'user_id', oldIds, uid);
    await reassign(TABLES.sharedCheckouts, 'sender_user_id', oldIds, uid);
    await reassign(TABLES.sharedBookings, 'sender_user_id', oldIds, uid);

    for (const fromId of oldIds) {
      const { data: reviews } = await admin
        .from(TABLES.productReviews)
        .select('id, product_id')
        .eq('user_id', fromId);
      for (const review of reviews ?? []) {
        const { data: existing } = await admin
          .from(TABLES.productReviews)
          .select('id')
          .eq('user_id', uid)
          .eq('product_id', review.product_id)
          .maybeSingle();
        if (existing) continue;
        await admin.from(TABLES.productReviews).update({ user_id: uid }).eq('id', review.id);
      }
    }

    const { error: deleteError } = await admin.from(TABLES.profiles).delete().in('id', oldIds);
    if (deleteError) {
      console.warn('[relink-profile] could not remove old profiles', deleteError.message);
    }
  }

  return {
    relinked: Boolean(donor),
    role,
    supplierId,
    providerId,
  };
}
