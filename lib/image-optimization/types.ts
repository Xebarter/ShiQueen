import type { ImageVariantName } from '@/lib/image-optimization/config';

export type OptimizedImageFormat = 'webp' | 'jpeg';

export type ProductImageVariants = Record<ImageVariantName, string>;

export type ClientOptimizeResult = {
  file: File;
  previewUrl: string;
  originalBytes: number;
  optimizedBytes: number;
  width: number;
  height: number;
  format: OptimizedImageFormat | 'original';
  hasAlpha: boolean;
  skipped: boolean;
};

export type ProductImageUploadResult = {
  url: string;
  variants: ProductImageVariants;
  bytes: number;
  width: number;
  height: number;
  format: OptimizedImageFormat;
  hash: string;
  duplicate: boolean;
};

export type PendingImageStatus = 'optimizing' | 'ready' | 'uploading' | 'duplicate' | 'error';
