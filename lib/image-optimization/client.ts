import {
  IMAGE_OPTIMIZATION,
  getClientDecodeConcurrency,
  isAllowedInputMime,
} from '@/lib/image-optimization/config';
import { fitInside } from '@/lib/image-optimization/geometry';
import type { ClientOptimizeResult, OptimizedImageFormat } from '@/lib/image-optimization/types';

const QUALITY = IMAGE_OPTIMIZATION.quality / 100;
const QUALITY_FLOOR = IMAGE_OPTIMIZATION.qualityFloor / 100;
const JPEG_QUALITY = IMAGE_OPTIMIZATION.jpegFallbackQuality / 100;

let decodeActive = 0;
const decodeWaiters: Array<() => void> = [];

function acquireDecodeSlot(): Promise<void> {
  const limit = getClientDecodeConcurrency();
  if (decodeActive < limit) {
    decodeActive += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    decodeWaiters.push(() => {
      decodeActive += 1;
      resolve();
    });
  });
}

function releaseDecodeSlot() {
  decodeActive = Math.max(0, decodeActive - 1);
  const next = decodeWaiters.shift();
  if (next) next();
}

export function isLikelyImageFile(file: File): boolean {
  if (isAllowedInputMime(file.type)) return true;
  if (!file.type || file.type === 'application/octet-stream') {
    return /\.(jpe?g|png|webp|gif|avif)$/i.test(file.name);
  }
  return false;
}

export async function hashBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function extensionFor(format: OptimizedImageFormat | 'original', fallbackName: string): string {
  if (format === 'webp') return 'webp';
  if (format === 'jpeg') return 'jpg';
  const match = fallbackName.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

function fileFromBlob(blob: Blob, originalName: string, format: OptimizedImageFormat | 'original'): File {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  const safeBase = base.replace(/[^a-zA-Z0-9.-]/g, '_');
  return new File([blob], `${safeBase}.${extensionFor(format, originalName)}`, {
    type: blob.type || 'image/jpeg',
    lastModified: Date.now(),
  });
}

async function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type: string,
  quality: number
): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not compress this image.'))),
      type,
      quality
    );
  });
}

function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getContext2d(canvas: HTMLCanvasElement | OffscreenCanvas): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Could not process this image on this device.');
  return ctx as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
}

function sampleHasAlpha(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  width: number,
  height: number
): boolean {
  const step = Math.max(1, Math.floor(Math.min(width, height) / 48));
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3] < 250) return true;
    }
  }
  return false;
}

async function decodeBitmap(file: File, width?: number, height?: number): Promise<ImageBitmap> {
  const resize =
    width && height
      ? { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' as const }
      : {};
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image', ...resize });
  } catch {
    return createImageBitmap(file, resize);
  }
}

async function decodeViaElement(file: File): Promise<{ width: number; height: number; bitmap: HTMLImageElement; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('This file is not a valid image.'));
      img.src = objectUrl;
    });
    return { width: image.naturalWidth, height: image.naturalHeight, bitmap: image, objectUrl };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function drawSource(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
}

async function encodeBest(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  hasAlpha: boolean,
  quality: number
): Promise<{ blob: Blob; format: OptimizedImageFormat | 'original' }> {
  if (hasAlpha) {
    try {
      const webp = await canvasToBlob(canvas, 'image/webp', quality);
      if (webp.size > 0) return { blob: webp, format: 'webp' };
    } catch {
      // fall through to PNG
    }
    const png = await canvasToBlob(canvas, 'image/png', 1);
    return { blob: png, format: 'original' };
  }

  let webp: Blob | null = null;
  try {
    webp = await canvasToBlob(canvas, 'image/webp', quality);
  } catch {
    webp = null;
  }

  const jpeg = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
  if (webp && webp.size > 0 && webp.size <= jpeg.size) {
    return { blob: webp, format: 'webp' };
  }
  if (jpeg.size > 0) return { blob: jpeg, format: 'jpeg' };
  if (webp && webp.size > 0) return { blob: webp, format: 'webp' };
  throw new Error('Could not compress this image.');
}

async function optimizeUncapped(file: File): Promise<ClientOptimizeResult> {
  if (file.type && !isLikelyImageFile(file)) {
    throw new Error('Please upload a JPEG, PNG, WebP, AVIF, or GIF image.');
  }
  if (file.size > IMAGE_OPTIMIZATION.pickerMaxBytes) {
    throw new Error('Each image must be 40MB or smaller.');
  }

  let width = 0;
  let height = 0;
  let source: ImageBitmap | HTMLImageElement | null = null;
  let elementUrl: string | null = null;
  let canvas: HTMLCanvasElement | OffscreenCanvas | null = null;

  try {
    let sourceWidth = 0;
    let sourceHeight = 0;

    if (typeof createImageBitmap === 'function') {
      const probe = await decodeBitmap(file);
      sourceWidth = probe.width;
      sourceHeight = probe.height;
      probe.close();
      const fitted = fitInside(sourceWidth, sourceHeight, IMAGE_OPTIMIZATION.clientMaxEdge);
      source = await decodeBitmap(file, fitted.width, fitted.height);
      width = source.width;
      height = source.height;
    } else {
      const decoded = await decodeViaElement(file);
      elementUrl = decoded.objectUrl;
      sourceWidth = decoded.width;
      sourceHeight = decoded.height;
      const fitted = fitInside(sourceWidth, sourceHeight, IMAGE_OPTIMIZATION.clientMaxEdge);
      width = fitted.width;
      height = fitted.height;
      source = decoded.bitmap;
    }

    if (!sourceWidth || !sourceHeight || !width || !height) {
      throw new Error('This file is not a valid image.');
    }
    if (sourceWidth * sourceHeight > IMAGE_OPTIMIZATION.maxPixels) {
      throw new Error('This image is too large to process.');
    }
    if (Math.max(sourceWidth, sourceHeight) > IMAGE_OPTIMIZATION.maxSourceEdge) {
      throw new Error('This image is too large to process.');
    }

    canvas = createCanvas(width, height);
    const ctx = getContext2d(canvas);
    drawSource(ctx, source, width, height);
    const hasAlpha = sampleHasAlpha(ctx, width, height);

    let { blob, format } = await encodeBest(canvas, hasAlpha, QUALITY);

    if (blob.size > IMAGE_OPTIMIZATION.postOptimizeMaxBytes) {
      const tighter = fitInside(width, height, IMAGE_OPTIMIZATION.variants.src);
      if (tighter.width !== width || tighter.height !== height) {
        const smaller = createCanvas(tighter.width, tighter.height);
        const smallCtx = getContext2d(smaller);
        drawSource(smallCtx, source, tighter.width, tighter.height);
        const second = await encodeBest(smaller, hasAlpha, QUALITY_FLOOR);
        if (second.blob.size < blob.size) {
          blob = second.blob;
          format = second.format;
          width = tighter.width;
          height = tighter.height;
        }
      } else {
        const second = await encodeBest(canvas, hasAlpha, QUALITY_FLOOR);
        if (second.blob.size < blob.size) {
          blob = second.blob;
          format = second.format;
        }
      }
    }

    const keepOriginal =
      blob.size >= file.size &&
      file.size <= IMAGE_OPTIMIZATION.postOptimizeMaxBytes &&
      Math.max(sourceWidth, sourceHeight) <= IMAGE_OPTIMIZATION.clientMaxEdge &&
      isAllowedInputMime(file.type) &&
      file.type !== 'image/gif' &&
      file.type !== 'image/avif';

    if (keepOriginal) {
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        originalBytes: file.size,
        optimizedBytes: file.size,
        width,
        height,
        format: 'original',
        hasAlpha,
        skipped: true,
      };
    }

    const optimizedFile = fileFromBlob(blob, file.name, format);
    return {
      file: optimizedFile,
      previewUrl: URL.createObjectURL(optimizedFile),
      originalBytes: file.size,
      optimizedBytes: optimizedFile.size,
      width,
      height,
      format,
      hasAlpha,
      skipped: false,
    };
  } finally {
    if (source && 'close' in source) {
      source.close();
    }
    if (elementUrl) URL.revokeObjectURL(elementUrl);
    canvas = null;
  }
}

export async function optimizeImageForUpload(file: File): Promise<ClientOptimizeResult> {
  await acquireDecodeSlot();
  try {
    return await optimizeUncapped(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const isValidation =
      message.includes('40MB') ||
      message.includes('JPEG, PNG') ||
      message.includes('not a valid') ||
      message.includes('too large to process');
    if (isValidation) {
      throw error instanceof Error ? error : new Error(message);
    }
    if (file.size <= IMAGE_OPTIMIZATION.apiMaxBytes && isLikelyImageFile(file)) {
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        originalBytes: file.size,
        optimizedBytes: file.size,
        width: 0,
        height: 0,
        format: 'original',
        hasAlpha: false,
        skipped: true,
      };
    }
    throw new Error('This image is too large to process on this device.');
  } finally {
    releaseDecodeSlot();
  }
}
