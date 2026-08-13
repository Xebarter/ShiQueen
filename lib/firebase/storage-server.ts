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

async function verifyAdmin(idToken: string, uid: string, email: string): Promise<void> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Firebase project ID is not configured.');
  }

  if (getAdminEmails().includes(email.toLowerCase())) {
    await ensureAdminFirestoreProfile(idToken, uid, email, projectId);
    return;
  }

  const profileResponse = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
    {
      headers: { Authorization: `Bearer ${idToken}` },
    }
  );

  if (profileResponse.ok) {
    const profile = (await profileResponse.json()) as {
      fields?: { role?: { stringValue?: string } };
    };
    if (profile.fields?.role?.stringValue === 'admin') {
      return;
    }
  }

  throw new Error('Admin access is required to upload images.');
}

/** Storage rules read Firestore role — sync admin role before upload when email is allowlisted. */
async function ensureAdminFirestoreProfile(
  idToken: string,
  uid: string,
  email: string,
  projectId: string
): Promise<void> {
  const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
  const headers = {
    Authorization: `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  };

  const existing = await fetch(docUrl, { headers: { Authorization: `Bearer ${idToken}` } });

  if (existing.ok) {
    const profile = (await existing.json()) as {
      fields?: { role?: { stringValue?: string } };
    };
    if (profile.fields?.role?.stringValue === 'admin') {
      return;
    }

    const patchResponse = await fetch(
      `${docUrl}?updateMask.fieldPaths=role&updateMask.fieldPaths=updatedAt`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fields: {
            role: { stringValue: 'admin' },
            updatedAt: { timestampValue: new Date().toISOString() },
          },
        }),
      }
    );

    if (!patchResponse.ok) {
      const errorText = await patchResponse.text();
      console.error('[SheQueen] Failed to sync admin role:', patchResponse.status, errorText);
      throw new Error(
        'Could not sync admin profile. In Firestore, set users/' + uid + ' → role = "admin".'
      );
    }
    return;
  }

  if (existing.status === 404) {
    const createResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?documentId=${uid}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fields: {
            uid: { stringValue: uid },
            email: { stringValue: email },
            role: { stringValue: 'admin' },
            createdAt: { timestampValue: new Date().toISOString() },
            updatedAt: { timestampValue: new Date().toISOString() },
          },
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[SheQueen] Failed to create admin profile:', createResponse.status, errorText);
      throw new Error(
        'Could not create admin profile. In Firestore, create users/' + uid + ' with role = "admin".'
      );
    }
    return;
  }

  throw new Error('Could not read your user profile from Firestore.');
}

function buildDownloadUrl(bucket: string, objectName: string, downloadToken: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectName)}?alt=media&token=${downloadToken}`;
}

async function uploadImageToStorage(
  idToken: string,
  objectPath: string,
  contentType: string,
  fileBuffer: Buffer,
  logLabel: string
): Promise<string> {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error('Firebase Storage bucket is not configured.');
  }

  const uploadUrl = new URL(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o`);
  uploadUrl.searchParams.set('uploadType', 'media');
  uploadUrl.searchParams.set('name', objectPath);

  let lastErrorText = '';

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const uploadResponse = await fetch(uploadUrl.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Firebase ${idToken}`,
        'Content-Type': contentType,
      },
      body: fileBuffer,
    });

    if (uploadResponse.ok) {
      const metadata = (await uploadResponse.json()) as {
        name?: string;
        downloadTokens?: string;
      };

      if (!metadata.name || !metadata.downloadTokens) {
        throw new Error('Upload succeeded but no download URL was returned.');
      }

      return buildDownloadUrl(bucket, metadata.name, metadata.downloadTokens);
    }

    lastErrorText = await uploadResponse.text();
    console.error(
      `[SheQueen] ${logLabel} upload failed (attempt ${attempt + 1}):`,
      uploadResponse.status,
      lastErrorText
    );

    if (uploadResponse.status === 403 && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      continue;
    }

    if (uploadResponse.status === 403) {
      throw new Error(
        'Storage permission denied. Sign out and back in, then run: firebase deploy --only storage'
      );
    }

    if (uploadResponse.status === 404) {
      throw new Error(
        'Storage bucket not found. Enable Firebase Storage in the Firebase Console for this project.'
      );
    }

    throw new Error(`Failed to upload image to Firebase Storage (${uploadResponse.status}).`);
  }

  throw new Error(`Failed to upload image to Firebase Storage. ${lastErrorText}`);
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
  await verifyAdmin(idToken, uid, email);

  const objectPath = `products/${productId}/${Date.now()}-${sanitizeFileName(fileName)}`;
  return uploadImageToStorage(idToken, objectPath, contentType, fileBuffer, 'Product image');
}

async function canUploadProviderLogo(
  idToken: string,
  uid: string,
  email: string,
  providerId: string
): Promise<boolean> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Firebase project ID is not configured.');
  }

  try {
    await verifyAdmin(idToken, uid, email);
    return true;
  } catch {
    // Fall through to provider ownership check.
  }

  const headers = { Authorization: `Bearer ${idToken}` };

  const [userResponse, providerResponse] = await Promise.all([
    fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
      { headers }
    ),
    fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/serviceProviders/${providerId}`,
      { headers }
    ),
  ]);

  if (!userResponse.ok || !providerResponse.ok) return false;

  const user = (await userResponse.json()) as {
    fields?: {
      providerId?: { stringValue?: string };
      role?: { stringValue?: string };
    };
  };
  const provider = (await providerResponse.json()) as {
    fields?: { ownerUid?: { stringValue?: string } };
  };

  const linkedProviderId = user.fields?.providerId?.stringValue;
  const ownerUid = provider.fields?.ownerUid?.stringValue;

  return linkedProviderId === providerId && ownerUid === uid;
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
  if (!trimmedId) {
    throw new Error('Provider ID is required.');
  }

  const { uid, email } = await verifyFirebaseToken(idToken);
  const allowed = await canUploadProviderLogo(idToken, uid, email, trimmedId);
  if (!allowed) {
    throw new Error('You can only upload a logo for your own services business.');
  }

  const objectPath = `providers/${trimmedId}/${Date.now()}-${sanitizeFileName(fileName)}`;
  return uploadImageToStorage(idToken, objectPath, contentType, fileBuffer, 'Provider logo');
}

async function canUploadSupplierLogo(
  idToken: string,
  uid: string,
  email: string,
  supplierId: string
): Promise<boolean> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Firebase project ID is not configured.');
  }

  try {
    await verifyAdmin(idToken, uid, email);
    return true;
  } catch {
    // Fall through to supplier ownership check.
  }

  const headers = { Authorization: `Bearer ${idToken}` };

  const [userResponse, supplierResponse] = await Promise.all([
    fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
      { headers }
    ),
    fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/suppliers/${supplierId}`,
      { headers }
    ),
  ]);

  if (!userResponse.ok || !supplierResponse.ok) return false;

  const user = (await userResponse.json()) as {
    fields?: {
      supplierId?: { stringValue?: string };
      role?: { stringValue?: string };
    };
  };
  const supplier = (await supplierResponse.json()) as {
    fields?: { ownerUid?: { stringValue?: string } };
  };

  const linkedSupplierId = user.fields?.supplierId?.stringValue;
  const ownerUid = supplier.fields?.ownerUid?.stringValue;

  return linkedSupplierId === supplierId && ownerUid === uid;
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
  if (!trimmedId) {
    throw new Error('Supplier ID is required.');
  }

  const { uid, email } = await verifyFirebaseToken(idToken);
  const allowed = await canUploadSupplierLogo(idToken, uid, email, trimmedId);
  if (!allowed) {
    throw new Error('You can only upload a logo for your own supplier account.');
  }

  const objectPath = `suppliers/${trimmedId}/${Date.now()}-${sanitizeFileName(fileName)}`;
  return uploadImageToStorage(idToken, objectPath, contentType, fileBuffer, 'Supplier logo');
}
