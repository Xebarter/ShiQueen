import { DEFAULT_USER_PREFERENCES } from '@/lib/account-settings';
import { getSupabaseClient } from '@/lib/supabase/client';
import { isSupabaseOfflineError } from '@/lib/supabase/errors';
import { generateId } from '@/lib/supabase/ids';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import {
  UserNotificationPreferences,
  UserProfile,
  UserRole,
  UserSavedAddress,
} from '@/lib/types/database';

function getAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function resolveUserRole(email: string): UserRole {
  return getAdminEmails().includes(email.toLowerCase()) ? 'admin' : 'customer';
}

function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

function mapPreferences(raw: unknown): UserNotificationPreferences | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const data = raw as Record<string, unknown>;
  return {
    orderUpdates:
      typeof data.orderUpdates === 'boolean'
        ? data.orderUpdates
        : DEFAULT_USER_PREFERENCES.orderUpdates,
    promotions:
      typeof data.promotions === 'boolean'
        ? data.promotions
        : DEFAULT_USER_PREFERENCES.promotions,
    serviceReminders:
      typeof data.serviceReminders === 'boolean'
        ? data.serviceReminders
        : DEFAULT_USER_PREFERENCES.serviceReminders,
    smsAlerts:
      typeof data.smsAlerts === 'boolean'
        ? data.smsAlerts
        : DEFAULT_USER_PREFERENCES.smsAlerts,
    pushAlerts:
      typeof data.pushAlerts === 'boolean'
        ? data.pushAlerts
        : DEFAULT_USER_PREFERENCES.pushAlerts,
  };
}

function mapSavedAddress(raw: unknown): UserSavedAddress | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const data = raw as Record<string, unknown>;
  const fullName = String(data.fullName ?? '').trim();
  const phone = String(data.phone ?? '').trim();
  const address = String(data.address ?? '').trim();
  const city = String(data.city ?? '').trim();
  if (!fullName && !phone && !address && !city) return undefined;
  return {
    fullName,
    phone,
    address,
    city: city || 'Kampala',
    district: data.district ? String(data.district) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
  };
}

function mapUserProfile(row: Record<string, unknown>): UserProfile {
  const uid = String(row.id ?? '');
  return {
    uid,
    email: String(row.email ?? ''),
    displayName: row.display_name ? String(row.display_name) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    photoURL: row.photo_url ? String(row.photo_url) : undefined,
    role: (row.role as UserRole) ?? 'customer',
    supplierId: row.supplier_id ? String(row.supplier_id) : undefined,
    providerId: row.provider_id ? String(row.provider_id) : undefined,
    preferences: mapPreferences(row.preferences),
    defaultAddress: mapSavedAddress(row.default_address),
    fcmTokens: Array.isArray(row.fcm_tokens)
      ? row.fcm_tokens.map(String).filter(Boolean)
      : [],
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function buildOfflineProfile(
  uid: string,
  email: string,
  displayName?: string,
  extras?: Pick<UserProfile, 'role' | 'supplierId' | 'providerId'>
): UserProfile {
  return {
    uid,
    email,
    displayName,
    role: extras?.role ?? resolveUserRole(email),
    supplierId: extras?.supplierId,
    providerId: extras?.providerId,
    preferences: { ...DEFAULT_USER_PREFERENCES },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function fetchUsers(): Promise<UserProfile[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from(TABLES.profiles).select('*');
  if (error) throw error;
  return (data ?? []).map((row) => mapUserProfile(row as Record<string, unknown>));
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLES.profiles)
    .select('*')
    .eq('id', uid)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapUserProfile(data as Record<string, unknown>);
}

export async function createUserProfile(
  uid: string,
  email: string,
  displayName?: string,
  options?: { role?: UserRole; supplierId?: string; providerId?: string }
): Promise<UserProfile> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const role = isAdminEmail(email) ? 'admin' : options?.role ?? resolveUserRole(email);

  const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
    uid,
    email,
    displayName,
    role,
    supplierId: options?.supplierId,
    providerId: options?.providerId,
  };

  const { error } = await supabase.from(TABLES.profiles).insert({
    id: profile.uid,
    email: profile.email,
    display_name: profile.displayName ?? null,
    role: profile.role,
    supplier_id: profile.supplierId ?? null,
    provider_id: profile.providerId ?? null,
  });

  if (error) throw error;

  return {
    ...profile,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Sync profile on login. Admin emails always become admin.
 * Existing supplier (and admin) roles are preserved when not an admin email.
 */
export async function ensureUserProfile(
  uid: string,
  email: string,
  displayName?: string
): Promise<UserProfile> {
  try {
    const existing = await getUserProfile(uid);

    if (existing) {
      if (isAdminEmail(email) && existing.role !== 'admin') {
        try {
          await updateUserRole(uid, 'admin');
          return { ...existing, role: 'admin', updatedAt: new Date() };
        } catch (error) {
          if (isSupabaseOfflineError(error)) {
            return { ...existing, role: 'admin', updatedAt: new Date() };
          }
          throw error;
        }
      }
      return existing;
    }

    return createUserProfile(uid, email, displayName);
  } catch (error) {
    if (isSupabaseOfflineError(error)) {
      console.warn('[ShiQueen] Supabase offline — using local profile for', email);
      return buildOfflineProfile(uid, email, displayName);
    }
    throw error;
  }
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from(TABLES.profiles).update({ role }).eq('id', uid);
  if (error) throw error;
}

export async function isUserAdmin(uid: string): Promise<boolean> {
  const profile = await getUserProfile(uid);
  return profile?.role === 'admin';
}

export function subscribeUsers(
  onData: (users: UserProfile[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.profiles, fetchUsers, onData, onError);
}

export function generateUserId(): string {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');
  return generateId();
}

export async function createCustomerProfile(data: {
  email: string;
  displayName?: string;
}): Promise<UserProfile> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const uid = generateUserId();
  const email = data.email.trim().toLowerCase();
  const displayName = data.displayName?.trim() || undefined;

  const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
    uid,
    email,
    displayName,
    role: 'customer',
  };

  const { error } = await supabase.from(TABLES.profiles).insert({
    id: profile.uid,
    email: profile.email,
    display_name: profile.displayName ?? null,
    role: profile.role,
  });

  if (error) throw error;

  return { ...profile, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<
    Pick<
      UserProfile,
      | 'displayName'
      | 'email'
      | 'phone'
      | 'photoURL'
      | 'role'
      | 'supplierId'
      | 'providerId'
      | 'preferences'
      | 'defaultAddress'
    >
  >
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const payload: Record<string, unknown> = {};

  if (updates.displayName !== undefined) {
    payload.display_name = updates.displayName.trim() || null;
  }
  if (updates.email !== undefined) {
    payload.email = updates.email.trim().toLowerCase();
  }
  if (updates.phone !== undefined) {
    payload.phone = updates.phone.trim() || null;
  }
  if (updates.photoURL !== undefined) {
    payload.photo_url = updates.photoURL.trim() || null;
  }
  if (updates.role !== undefined) {
    payload.role = updates.role;
  }
  if (updates.supplierId !== undefined) {
    payload.supplier_id = updates.supplierId || null;
  }
  if (updates.providerId !== undefined) {
    payload.provider_id = updates.providerId || null;
  }
  if (updates.preferences !== undefined) {
    payload.preferences = updates.preferences;
  }
  if (updates.defaultAddress !== undefined) {
    const address = updates.defaultAddress;
    payload.default_address = address
      ? {
          fullName: address.fullName.trim(),
          phone: address.phone.trim(),
          address: address.address.trim(),
          city: address.city.trim() || 'Kampala',
          district: address.district?.trim() || null,
          notes: address.notes?.trim() || null,
        }
      : null;
  }

  const { error } = await supabase.from(TABLES.profiles).update(payload).eq('id', uid);
  if (error) throw error;
}

export async function addUserFcmToken(uid: string, token: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || !token) return;

  const profile = await getUserProfile(uid);
  if (!profile) return;

  const tokens = profile.fcmTokens ?? [];
  if (tokens.includes(token)) return;

  const { error } = await supabase
    .from(TABLES.profiles)
    .update({ fcm_tokens: [...tokens, token] })
    .eq('id', uid);

  if (error) throw error;
}

export async function removeUserFcmToken(uid: string, token: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || !token) return;

  const profile = await getUserProfile(uid);
  if (!profile) return;

  const tokens = profile.fcmTokens ?? [];
  if (!tokens.includes(token)) return;

  const { error } = await supabase
    .from(TABLES.profiles)
    .update({ fcm_tokens: tokens.filter((entry) => entry !== token) })
    .eq('id', uid);

  if (error) throw error;
}

export async function deleteUserProfile(uid: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from(TABLES.profiles).delete().eq('id', uid);
  if (error) throw error;
}
