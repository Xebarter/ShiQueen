#!/usr/bin/env node
/**
 * DEPRECATED when using Firebase Auth + Supabase Third-Party Auth.
 * Users stay in Firebase — run `npm run migrate:firebase-claims` instead.
 *
 * One-time migration: Firebase Auth users → Supabase Auth (legacy path only)
 *
 * Requires:
 * - FIREBASE_SERVICE_ACCOUNT_JSON
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: node scripts/migrate/auth-users.mjs
 */

import './load-env.mjs';
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
if (!serviceAccount.project_id) {
  console.error('Set FIREBASE_SERVICE_ACCOUNT_JSON');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const uidMap = new Map();

async function migrateUsers() {
  let pageToken;
  let migrated = 0;

  do {
    const result = await admin.auth().listUsers(1000, pageToken);
    for (const user of result.users) {
      if (!user.email) continue;

      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: user.emailVerified,
        user_metadata: {
          full_name: user.displayName ?? null,
          firebase_uid: user.uid,
        },
        app_metadata: {
          provider: user.providerData[0]?.providerId ?? 'email',
        },
      });

      if (error) {
        console.warn(`Skip ${user.email}: ${error.message}`);
        continue;
      }

      uidMap.set(user.uid, data.user.id);
      migrated += 1;
    }
    pageToken = result.pageToken;
  } while (pageToken);

  console.log(`Migrated ${migrated} auth users. UID map size: ${uidMap.size}`);
  console.log('Save uid mapping for Firestore migration if UIDs changed.');
}

migrateUsers().catch((error) => {
  console.error(error);
  process.exit(1);
});
