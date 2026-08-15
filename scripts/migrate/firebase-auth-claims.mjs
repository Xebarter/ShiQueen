#!/usr/bin/env node
/**
 * Set role: authenticated custom claim on all Firebase users (required for Supabase Third-Party Auth).
 *
 * Usage: node scripts/migrate/firebase-auth-claims.mjs
 */

import './load-env.mjs';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
if (!serviceAccount.project_id) {
  console.error('Set FIREBASE_SERVICE_ACCOUNT_JSON');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function setRoleClaims() {
  let nextPageToken;
  let updated = 0;

  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    await Promise.all(
      result.users.map(async (user) => {
        const existing = user.customClaims ?? {};
        if (existing.role === 'authenticated') return;
        await admin.auth().setCustomUserClaims(user.uid, {
          ...existing,
          role: 'authenticated',
        });
        updated += 1;
      })
    );
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  console.log(`Set role:authenticated on ${updated} Firebase users.`);
  console.log('Users must sign out and back in (or force-refresh token) to pick up the claim.');
}

setRoleClaims().catch((error) => {
  console.error(error);
  process.exit(1);
});
