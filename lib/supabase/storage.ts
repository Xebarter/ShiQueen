import { getFirebaseAuth } from '@/lib/firebase/auth';
import { optimizeImageForUpload, hashBlob } from '@/lib/image-optimization/client';
import { IMAGE_OPTIMIZATION, getUploadConcurrency } from '@/lib/image-optimization/config';
import {
  mapWithConcurrency,
  parseProductImageUploadResponse,
  uploadFormDataWithRetry,
} from '@/lib/image-optimization/upload-queue';
import type { ProductImageUploadResult } from '@/lib/image-optimization/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function getIdToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) throw new Error('You must be signed in to upload images.');
  return user.getIdToken(true);
}

export async function uploadOptimizedProductImage(
  productId: string,
  file: File,
  options?: { signal?: AbortSignal; onProgress?: (percent: number) => void }
): Promise<ProductImageUploadResult> {
  if (file.size > IMAGE_OPTIMIZATION.apiMaxBytes) {
    throw new Error('Each image must be 8MB or smaller after optimization.');
  }

  const idToken = await getIdToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('productId', productId);

  const payload = await uploadFormDataWithRetry({
    url: '/api/admin/upload-product-image',
    token: idToken,
    formData,
    signal: options?.signal,
    onProgress: options?.onProgress,
  });

  return parseProductImageUploadResponse(payload);
}

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const optimized = await optimizeImageForUpload(file);
  try {
    const result = await uploadOptimizedProductImage(productId, optimized.file);
    return result.url;
  } finally {
    URL.revokeObjectURL(optimized.previewUrl);
  }
}

export async function uploadMarketingBanner(adId: string, file: File): Promise<string> {
  return uploadProductImage(`ad-${adId}`, file);
}

export async function uploadPackageImage(packageId: string, file: File): Promise<string> {
  return uploadProductImage(`package-${packageId}`, file);
}

export async function uploadProviderImage(providerId: string, file: File): Promise<string> {
  return uploadProductImage(`provider-${providerId}`, file);
}

export async function uploadProviderLogo(providerId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please upload a JPEG, PNG, WebP, or GIF image.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Each image must be 5MB or smaller.');
  }

  const idToken = await getIdToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('providerId', providerId);

  const response = await fetch('/api/partner/upload-provider-image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData,
  });

  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok) throw new Error(payload.error ?? 'Failed to upload logo.');
  if (!payload.url) throw new Error('Upload succeeded but no image URL was returned.');
  return payload.url;
}

export async function uploadSupplierLogo(supplierId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please upload a JPEG, PNG, WebP, or GIF image.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Each image must be 5MB or smaller.');
  }

  const idToken = await getIdToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('supplierId', supplierId);

  const response = await fetch('/api/partner/upload-supplier-image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData,
  });

  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok) throw new Error(payload.error ?? 'Failed to upload logo.');
  if (!payload.url) throw new Error('Upload succeeded but no image URL was returned.');
  return payload.url;
}

export async function uploadProviderImages(providerId: string, files: File[]): Promise<string[]> {
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
  files: File[],
  options?: {
    alreadyOptimized?: boolean;
    signal?: AbortSignal;
    onFileProgress?: (index: number, percent: number) => void;
    onFileStatus?: (index: number, status: 'uploading' | 'duplicate' | 'done') => void;
  }
): Promise<string[]> {
  if (files.length === 0) return [];

  const prepared: File[] = [];
  const previewUrls: string[] = [];

  try {
    if (options?.alreadyOptimized) {
      prepared.push(...files);
    } else {
      for (const file of files) {
        const optimized = await optimizeImageForUpload(file);
        prepared.push(optimized.file);
        previewUrls.push(optimized.previewUrl);
      }
    }

    const inFlight = new Map<string, Promise<ProductImageUploadResult>>();
    const results = await mapWithConcurrency(
      prepared,
      getUploadConcurrency(),
      async (file, index, signal) => {
        const digest = await hashBlob(file);
        const existing = inFlight.get(digest);
        if (existing) {
          options?.onFileStatus?.(index, 'duplicate');
          return existing;
        }

        options?.onFileStatus?.(index, 'uploading');
        const task = uploadOptimizedProductImage(productId, file, {
          signal,
          onProgress: (percent) => options?.onFileProgress?.(index, percent),
        }).then((uploaded) => {
          options?.onFileStatus?.(index, uploaded.duplicate ? 'duplicate' : 'done');
          return uploaded;
        });
        inFlight.set(digest, task);
        return task;
      },
      options?.signal
    );

    return results.map((result) => result.url);
  } finally {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }
}
