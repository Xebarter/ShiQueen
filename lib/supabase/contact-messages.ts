import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isSupabaseAdminConfigured } from '@/lib/supabase/config';
import { getSupabaseClient } from '@/lib/supabase/client';
import { generateId } from '@/lib/supabase/ids';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import type {
  ContactMessage,
  ContactMessageStatus,
  ContactMessageTopic,
} from '@/lib/types/contact-messages';

function mapContactMessage(row: Record<string, unknown>): ContactMessage {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    topic: String(row.topic ?? 'general'),
    subject: String(row.subject ?? ''),
    message: String(row.message ?? ''),
    status: (row.status as ContactMessageStatus) ?? 'unread',
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

async function fetchContactMessages(): Promise<ContactMessage[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.contactMessages)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapContactMessage(row as Record<string, unknown>));
}

export function subscribeContactMessages(
  onData: (messages: ContactMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.contactMessages, fetchContactMessages, onData, onError);
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase
    .from(TABLES.contactMessages)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteContactMessage(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase.from(TABLES.contactMessages).delete().eq('id', id);
  if (error) throw error;
}

export type CreateContactMessageInput = {
  name: string;
  email: string;
  topic: ContactMessageTopic | string;
  subject: string;
  message: string;
};

/** Server-only insert via service role (public contact form). */
export async function createContactMessageServer(
  input: CreateContactMessageInput
): Promise<ContactMessage> {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('Database is not configured');
  }

  const admin = getSupabaseAdmin();
  const id = `msg_${generateId()}`;
  const now = new Date().toISOString();
  const row = {
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    topic: input.topic.trim() || 'general',
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: 'unread',
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await admin
    .from(TABLES.contactMessages)
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;
  return mapContactMessage(data as Record<string, unknown>);
}

export async function getContactMessageServer(id: string): Promise<ContactMessage | null> {
  if (!isSupabaseAdminConfigured() || !id) return null;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(TABLES.contactMessages)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapContactMessage(data as Record<string, unknown>);
}
