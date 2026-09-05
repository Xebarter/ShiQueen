import { createHash } from 'node:crypto';
import sharp from 'sharp';
import {
  ALLOWED_SHARP_FORMATS,
  IMAGE_OPTIMIZATION,
  IMAGE_VARIANT_NAMES,
  type ImageVariantName,
} from '@/lib/image-optimization/config';
import type { OptimizedImageFormat } from '@/lib/image-optimization/types';

type SharpInstance = ReturnType<typeof sharp>;
type SharpMetadata = Awaited<ReturnType<SharpInstance['metadata']>>;

const QUALITY = IMAGE_OPTIMIZATION.quality;
const REJECTED_DECLARED_TYPES = new Set([
  'image/svg+xml',
  'image/svg',
  'text/html',
  'text/xml',
  'application/xml',
  'application/pdf',
]);

export type EncodedVariantSet = {
  hash: string;
  format: OptimizedImageFormat;
  contentType: string;
  extension: 'webp' | 'jpeg';
  width: number;
  height: number;
  hasAlpha: boolean;
  variants: Record<ImageVariantName, Buffer>;
  srcBytes: number;
};

function assertSafeDeclaredType(contentType: string) {
  const type = contentType.toLowerCase().split(';')[0].trim();
  if (!type || type === 'application/octet-stream') return;
  if (REJECTED_DECLARED_TYPES.has(type)) {
    throw new Error('Please upload a JPEG, PNG, WebP, AVIF, or GIF image.');
  }
}

export function assertUploadBufferSize(byteLength: number) {
  if (byteLength <= 0) {
    throw new Error('No image file provided.');
  }
  if (byteLength > IMAGE_OPTIMIZATION.apiMaxBytes) {
    throw new Error('Each image must be 8MB or smaller after optimization.');
  }
}

type EncodeMode =
  | { type: 'webp'; quality: number; lossless?: false }
  | { type: 'webp'; lossless: true }
  | { type: 'jpeg'; quality: number };

async function encodeWithMode(pipeline: SharpInstance, mode: EncodeMode): Promise<Buffer> {
  if (mode.type === 'jpeg') {
    return pipeline.jpeg({
      quality: mode.quality,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: '4:2:0',
    }).toBuffer();
  }
  if ('lossless' in mode && mode.lossless) {
    return pipeline.webp({ lossless: true, effort: IMAGE_OPTIMIZATION.webpEffort, alphaQuality: 100 }).toBuffer();
  }
  return pipeline
    .webp({
      quality: mode.quality,
      effort: IMAGE_OPTIMIZATION.webpEffort,
      alphaQuality: IMAGE_OPTIMIZATION.alphaQuality,
    })
    .toBuffer();
}

function sizedPipeline(source: Buffer, maxEdge: number): SharpInstance {
  return sharp(source, { failOn: 'truncated', sequentialRead: true }).resize({
    width: maxEdge,
    height: maxEdge,
    fit: 'inside',
    withoutEnlargement: true,
    kernel: 'lanczos3',
  });
}

async function pickEncodeMode(srcBuffer: Buffer, hasAlpha: boolean): Promise<EncodeMode> {
  const quality = QUALITY;
  const src = () => sizedPipeline(srcBuffer, IMAGE_OPTIMIZATION.variants.src);

  if (hasAlpha) {
    const lossy = await encodeWithMode(src(), { type: 'webp', quality });
    const lossless = await encodeWithMode(src(), { type: 'webp', lossless: true });
    if (lossless.byteLength < lossy.byteLength) {
      return { type: 'webp', lossless: true };
    }
    return { type: 'webp', quality };
  }

  const webp = await encodeWithMode(src(), { type: 'webp', quality });
  const jpeg = await encodeWithMode(src(), { type: 'jpeg', quality });
  if (jpeg.byteLength < webp.byteLength) {
    return { type: 'jpeg', quality };
  }
  return { type: 'webp', quality };
}

export async function optimizeProductImageBuffer(
  fileBuffer: Buffer,
  declaredContentType = ''
): Promise<EncodedVariantSet> {
  assertSafeDeclaredType(declaredContentType);
  assertUploadBufferSize(fileBuffer.byteLength);

  const input = sharp(fileBuffer, {
    failOn: 'truncated',
    limitInputPixels: IMAGE_OPTIMIZATION.maxPixels,
    animated: false,
    pages: 1,
    page: 0,
  });

  let metadata: SharpMetadata;
  try {
    metadata = await input.metadata();
  } catch {
    throw new Error('This file is not a valid image.');
  }

  const format = (metadata.format ?? '').toLowerCase();
  if (!ALLOWED_SHARP_FORMATS.has(format) || format === 'svg') {
    throw new Error('Please upload a JPEG, PNG, WebP, AVIF, or GIF image.');
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) {
    throw new Error('This file is not a valid image.');
  }
  if (width * height > IMAGE_OPTIMIZATION.maxPixels) {
    throw new Error('This image is too large to process.');
  }
  if (Math.max(width, height) > IMAGE_OPTIMIZATION.maxSourceEdge) {
    throw new Error('This image is too large to process.');
  }

  const normalized = await sharp(fileBuffer, {
    failOn: 'truncated',
    limitInputPixels: IMAGE_OPTIMIZATION.maxPixels,
    animated: false,
    pages: 1,
    page: 0,
  })
    .rotate()
    .toColourspace('srgb')
    .resize({
      width: IMAGE_OPTIMIZATION.variants.zoom,
      height: IMAGE_OPTIMIZATION.variants.zoom,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: 'lanczos3',
    })
    .toBuffer();

  const normalizedMeta = await sharp(normalized).metadata();
  const hasAlpha = Boolean(normalizedMeta.hasAlpha);

  const srcRaw = await sizedPipeline(normalized, IMAGE_OPTIMIZATION.variants.src)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hash = createHash('sha256')
    .update(srcRaw.data)
    .digest('hex')
    .slice(0, IMAGE_OPTIMIZATION.hashLength);

  const mode = await pickEncodeMode(normalized, hasAlpha);
  const extension: 'webp' | 'jpeg' = mode.type === 'jpeg' ? 'jpeg' : 'webp';
  const contentType = mode.type === 'jpeg' ? 'image/jpeg' : 'image/webp';

  const variants = {} as Record<ImageVariantName, Buffer>;
  for (const name of IMAGE_VARIANT_NAMES) {
    variants[name] = await encodeWithMode(
      sizedPipeline(normalized, IMAGE_OPTIMIZATION.variants[name]),
      mode
    );
  }

  const srcInfo = await sharp(variants.src).metadata();

  return {
    hash,
    format: mode.type,
    contentType,
    extension,
    width: srcInfo.width ?? srcRaw.info.width,
    height: srcInfo.height ?? srcRaw.info.height,
    hasAlpha,
    variants,
    srcBytes: variants.src.byteLength,
  };
}
