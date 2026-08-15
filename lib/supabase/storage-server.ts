import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/supabase/tables';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

function getAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function verifyFirebaseToken(idToken: string): Promise<{ uid: string; email: string }> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Firebase API key is not configured.');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!response.ok) {
    throw new Error('Invalid or expired sign-in session. Please sign in again.');
  }

  const data = (await response.json()) as {
    users?: Array<{ localId: string; email?: string }>;
  };

  const user = data.users?.[0];
  if (!user?.localId || !user.email) {
    throw new Error('Could not verify your account.');
  }

  return { uid: user.localId, email: user.email };
}

async function ensureAdminProfile(uid: string, email: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from(TABLES.profiles).select('role').eq('id', uid).maybeSingle();

  if (profile?.role === 'admin') return;

  const { error } = await admin.from(TABLES.profiles).upsert({
    id: uid,
    email: email.toLowerCase(),
    role: 'admin',
  });

  if (error) {
    throw new Error(`Could not sync admin profile for ${uid}.`);
  }
}

async function isAdminUser(uid: string, email: string): Promise<boolean> {
  if (getAdminEmails().includes(email.toLowerCase())) {
    await ensureAdminProfile(uid, email);
    return true;
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from(TABLES.profiles).select('role').eq('id', uid).maybeSingle();
  return profile?.role === 'admin';
}

async function verifyAdmin(uid: string, email: string): Promise<void> {
  if (await isAdminUser(uid, email)) return;
  throw new Error('Admin access is required to upload images.');
}

type ProfileAuthRow = {
  role?: string | null;
  supplier_id?: string | null;
  provider_id?: string | null;
};

async function getProfileAuth(uid: string): Promise<ProfileAuthRow | null> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from(TABLES.profiles)
    .select('role, supplier_id, provider_id')
    .eq('id', uid)
    .maybeSingle();
  return data;
}

/**
 * Catalog images (products / packages) may be uploaded by admins or by the
 * linked supplier. New IDs are allowed during create flows before the row exists.
 * Marketing banners stay admin-only.
 */
async function verifyCatalogImageUpload(
  uid: string,
  email: string,
  objectKey: string
): Promise<void> {
  if (await isAdminUser(uid, email)) return;

  const key = objectKey.trim();
  if (key.startsWith('ad-')) {
    throw new Error('Admin access is required to upload marketing images.');
  }

  const profile = await getProfileAuth(uid);
  const supplierId = profile?.supplier_id?.trim() || null;
  const isSupplier =
    profile?.role === 'supplier' || Boolean(supplierId);

  if (key.startsWith('provider-')) {
    const linkedProviderId = profile?.provider_id?.trim() || null;
    if (linkedProviderId && key.startsWith(`provider-${linkedProviderId}`)) {
      return;
    }
    const admin = getSupabaseAdmin();
    if (linkedProviderId) {
      const { data: provider } = await admin
        .from(TABLES.serviceProviders)
        .select('owner_uid')
        .eq('id', linkedProviderId)
        .maybeSingle();
      if (provider?.owner_uid === uid && key.startsWith(`provider-${linkedProviderId}`)) {
        return;
      }
    }
    throw new Error('You can only upload images for your own services business.');
  }

  if (!isSupplier || !supplierId) {
    throw new Error('Supplier or admin access is required to upload images.');
  }

  if (key.startsWith('package-')) {
    const packageId = key.replace(/^package-/, '').replace(/-item-.*$/, '');
    const admin = getSupabaseAdmin();
    const { data: pkg } = await admin
      .from(TABLES.packages)
      .select('supplier_id')
      .eq('id', packageId)
      .maybeSingle();

    // Creating a new package — row may not exist yet.
    if (!pkg) return;
    if (pkg.supplier_id === supplierId) return;
    throw new Error('You can only upload images for your own packages.');
  }

  // Product image (create or edit)
  const admin = getSupabaseAdmin();
  const { data: product } = await admin
    .from(TABLES.products)
    .select('supplier_id')
    .eq('id', key)
    .maybeSingle();

  if (!product) return; // new product create flow
  if (product.supplier_id === supplierId) return;
  throw new Error('You can only upload images for your own products.');
}

function getPublicUrl(bucket: string, path: string): string {
  const admin = getSupabaseAdmin();
  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadToBucket(
  bucket: string,
  objectPath: string,
  contentType: string,
  fileBuffer: Buffer
): Promise<string> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from(bucket).upload(objectPath, fileBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload image (${error.message}).`);
  }

  return getPublicUrl(bucket, objectPath);
}

export async function uploadProductImageServer(
  idToken: string,
  productId: string,
  fileName: string,
  contentType: string,
  fileBuffer: Buffer
): Promise<string> {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error('Please upload a JPEG, PNG, WebP, or GIF image.');
  }
  if (fileBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('Each image must be 5MB or smaller.');
  }

  const { uid, email } = await verifyFirebaseToken(idToken);
  await verifyCatalogImageUpload(uid, email, productId);

  const objectPath = `${productId}/${Date.now()}-${sanitizeFileName(fileName)}`;
  return uploadToBucket('products', objectPath, contentType, fileBuffer);
}

async function canUploadProviderLogo(uid: string, email: string, providerId: string): Promise<boolean> {
  try {
    await verifyAdmin(uid, email);
    return true;
  } catch {
    // fall through
  }

  const admin = getSupabaseAdmin();
  const [{ data: profile }, { data: provider }] = await Promise.all([
    admin.from(TABLES.profiles).select('provider_id').eq('id', uid).maybeSingle(),
    admin.from(TABLES.serviceProviders).select('owner_uid').eq('id', providerId).maybeSingle(),
  ]);

  return profile?.provider_id === providerId && provider?.owner_uid === uid;
}

export async function uploadProviderLogoServer(
  idToken: string,
  providerId: string,
  fileName: string,
  contentType: string,
  fileBuffer: Buffer
): Promise<string> {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error('Please upload a JPEG, PNG, WebP, or GIF image.');
  }
  if (fileBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('Each image must be 5MB or smaller.');
  }

  const trimmedId = providerId.trim();
  if (!trimmedId) throw new Error('Provider ID is required.');

  const { uid, email } = await verifyFirebaseToken(idToken);
  const allowed = await canUploadProviderLogo(uid, email, trimmedId);
  if (!allowed) {
    throw new Error('You can only upload a logo for your own services business.');
  }

  const objectPath = `${trimmedId}/${Date.now()}-${sanitizeFileName(fileName)}`;
  return uploadToBucket('providers', objectPath, contentType, fileBuffer);
}

async function canUploadSupplierLogo(uid: string, email: string, supplierId: string): Promise<boolean> {
  try {
    await verifyAdmin(uid, email);
    return true;
  } catch {
    // fall through
  }

  const admin = getSupabaseAdmin();
  const [{ data: profile }, { data: supplier }] = await Promise.all([
    admin.from(TABLES.profiles).select('supplier_id').eq('id', uid).maybeSingle(),
    admin.from(TABLES.suppliers).select('owner_uid').eq('id', supplierId).maybeSingle(),
  ]);

  return profile?.supplier_id === supplierId && supplier?.owner_uid === uid;
}

export async function uploadSupplierLogoServer(
  idToken: string,
  supplierId: string,
  fileName: string,
  contentType: string,
  fileBuffer: Buffer
): Promise<string> {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error('Please upload a JPEG, PNG, WebP, or GIF image.');
  }
  if (fileBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('Each image must be 5MB or smaller.');
  }

  const trimmedId = supplierId.trim();
  if (!trimmedId) throw new Error('Supplier ID is required.');

  const { uid, email } = await verifyFirebaseToken(idToken);
  const allowed = await canUploadSupplierLogo(uid, email, trimmedId);
  if (!allowed) {
    throw new Error('You can only upload a logo for your own supplier account.');
  }

  const objectPath = `${trimmedId}/${Date.now()}-${sanitizeFileName(fileName)}`;
  return uploadToBucket('suppliers', objectPath, contentType, fileBuffer);
}
