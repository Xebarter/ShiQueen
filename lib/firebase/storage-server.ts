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

  throw new Error('Admin access is required to upload product images.');
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

  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error('Firebase Storage bucket is not configured.');
  }

  const { uid, email } = await verifyFirebaseToken(idToken);
  await verifyAdmin(idToken, uid, email);

  const objectPath = `products/${productId}/${Date.now()}-${sanitizeFileName(fileName)}`;
  const uploadUrl = new URL(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o`);
  uploadUrl.searchParams.set('uploadType', 'media');
  uploadUrl.searchParams.set('name', objectPath);

  const uploadResponse = await fetch(uploadUrl.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Firebase ${idToken}`,
      'Content-Type': contentType,
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('[SheQueen] Storage upload failed:', uploadResponse.status, errorText);

    if (uploadResponse.status === 403) {
      throw new Error(
        'Storage permission denied. Enable Firebase Storage in the Console, deploy rules (firebase deploy --only storage), sign out/in, and ensure your Firestore users doc has role "admin".'
      );
    }

    if (uploadResponse.status === 404) {
      throw new Error(
        'Storage bucket not found. Enable Firebase Storage in the Firebase Console for this project.'
      );
    }

    throw new Error('Failed to upload image to Firebase Storage.');
  }

  const metadata = (await uploadResponse.json()) as {
    name?: string;
    downloadTokens?: string;
  };

  if (!metadata.name || !metadata.downloadTokens) {
    throw new Error('Upload succeeded but no download URL was returned.');
  }

  return buildDownloadUrl(bucket, metadata.name, metadata.downloadTokens);
}
