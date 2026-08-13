import { getFirebaseAuth } from '@/lib/firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please upload a JPEG, PNG, WebP, or GIF image.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Each image must be 5MB or smaller.');
  }

  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('You must be signed in as an admin to upload images.');
  }

  const idToken = await user.getIdToken(true);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('productId', productId);

  const response = await fetch('/api/admin/upload-product-image', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: formData,
  });

  const payload = (await response.json()) as { url?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to upload image.');
  }

  if (!payload.url) {
    throw new Error('Upload succeeded but no image URL was returned.');
  }

  return payload.url;
}

/** Banner images use the same product upload API/path as product photos. */
export async function uploadMarketingBanner(adId: string, file: File): Promise<string> {
  return uploadProductImage(`ad-${adId}`, file);
}

export async function uploadPackageImage(packageId: string, file: File): Promise<string> {
  return uploadProductImage(`package-${packageId}`, file);
}

export async function uploadProviderImage(providerId: string, file: File): Promise<string> {
  return uploadProductImage(`provider-${providerId}`, file);
}

export async function uploadProviderImages(
  providerId: string,
  files: File[]
): Promise<string[]> {
  if (files.length === 0) return [];
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadProviderImage(providerId, file));
  }
  return urls;
}

export async function uploadPackageItemImage(
  packageId: string,
  itemId: string,
  file: File
): Promise<string> {
  return uploadProductImage(`package-${packageId}-item-${itemId}`, file);
}

export async function uploadProductImages(
  productId: string,
  files: File[]
): Promise<string[]> {
  if (files.length === 0) return [];

  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadProductImage(productId, file));
  }
  return urls;
}
