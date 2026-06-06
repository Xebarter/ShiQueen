import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from '@/lib/firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please upload a JPEG, PNG, WebP, or GIF image.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Each image must be 5MB or smaller.');
  }

  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error('Firebase Storage is not initialized.');
  }

  const storageRef = ref(
    storage,
    `products/${productId}/${Date.now()}-${sanitizeFileName(file.name)}`
  );

  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function uploadProductImages(
  productId: string,
  files: File[]
): Promise<string[]> {
  if (files.length === 0) return [];
  return Promise.all(files.map((file) => uploadProductImage(productId, file)));
}
