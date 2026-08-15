#!/usr/bin/env node
/**
 * Copy Firebase Storage objects to Supabase Storage and rewrite URLs in Postgres.
 *
 * Usage: node scripts/migrate/storage-files.mjs
 */

import './load-env.mjs';
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!serviceAccount.project_id || !bucketName) {
  console.error('Set FIREBASE_SERVICE_ACCOUNT_JSON and NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: bucketName,
});

const bucket = admin.storage().bucket();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const BUCKET_MAP = {
  products: 'products',
  providers: 'providers',
  suppliers: 'suppliers',
  ads: 'ads',
};

function mapPath(name) {
  const [prefix, ...rest] = name.split('/');
  const targetBucket = BUCKET_MAP[prefix];
  if (!targetBucket) return null;
  return { bucket: targetBucket, path: rest.join('/') || name };
}

async function migrateFiles() {
  const [files] = await bucket.getFiles();
  let copied = 0;

  for (const file of files) {
    const mapped = mapPath(file.name);
    if (!mapped) continue;

    const [buffer] = await file.download();
    const { error } = await supabase.storage.from(mapped.bucket).upload(mapped.path, buffer, {
      upsert: true,
      contentType: file.metadata.contentType,
    });

    if (error) {
      console.warn(`Skip ${file.name}: ${error.message}`);
      continue;
    }

    copied += 1;
  }

  console.log(`Copied ${copied} storage files to Supabase.`);
  console.log('Run URL rewrite separately for product/service image columns if needed.');
}

migrateFiles().catch((error) => {
  console.error(error);
  process.exit(1);
});
