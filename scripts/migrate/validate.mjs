#!/usr/bin/env node
/**
 * Validate record counts after migration.
 *
 * Usage: node scripts/migrate/validate.mjs
 */

import './load-env.mjs';
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

const pairs = [
  ['users', 'profiles'],
  ['products', 'products'],
  ['orders', 'orders'],
  ['packages', 'packages'],
  ['suppliers', 'suppliers'],
  ['serviceCategories', 'service_categories'],
  ['serviceProviders', 'service_providers'],
  ['services', 'services'],
  ['serviceBookings', 'service_bookings'],
];

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function countFirestore(collection) {
  const snap = await db.collection(collection).count().get();
  return snap.data().count;
}

async function countSupabase(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

async function main() {
  console.log('Collection\tFirestore\tSupabase\tMatch');
  for (const [collection, table] of pairs) {
    const [fs, sb] = await Promise.all([countFirestore(collection), countSupabase(table)]);
    console.log(`${collection}\t${fs}\t${sb}\t${fs === sb ? 'OK' : 'MISMATCH'}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
