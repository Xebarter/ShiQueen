export const IMAGE_OPTIMIZATION = {
  pickerMaxBytes: 40 * 1024 * 1024,
  apiMaxBytes: 8 * 1024 * 1024,
  postOptimizeMaxBytes: 2 * 1024 * 1024,
  maxPixels: 40_000_000,
  maxSourceEdge: 8000,
  clientMaxEdge: 2560,
  quality: 82,
  qualityFloor: 76,
  qualityCeiling: 88,
  jpegFallbackQuality: 85,
  webpEffort: 4,
  alphaQuality: 90,
  variants: {
    thumb: 320,
    card: 800,
    src: 1600,
    zoom: 2400,
  },
  galleryMax: 12,
  cacheControl: '31536000',
  hashLength: 16,
  retries: 2,
  retryBaseDelayMs: 400,
} as const;

export type ImageVariantName = keyof typeof IMAGE_OPTIMIZATION.variants;

export const IMAGE_VARIANT_NAMES = ['thumb', 'card', 'src', 'zoom'] as const satisfies readonly ImageVariantName[];

export const ALLOWED_INPUT_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
] as const;

export type AllowedInputMime = (typeof ALLOWED_INPUT_MIME)[number];

export const IMAGE_ACCEPT_ATTRIBUTE = [...ALLOWED_INPUT_MIME, 'image/jpg'].join(',');

export const ALLOWED_SHARP_FORMATS = new Set(['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif']);

export function isAllowedInputMime(type: string): type is AllowedInputMime {
  const normalized = type.toLowerCase().split(';')[0].trim();
  if (normalized === 'image/jpg') return true;
  return (ALLOWED_INPUT_MIME as readonly string[]).includes(normalized);
}

export function getUploadConcurrency(): number {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return 3;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  if (connection?.saveData) return 2;
  if (window.matchMedia?.('(pointer: coarse)').matches) return 2;
  return 3;
}

export function getClientDecodeConcurrency(): number {
  if (typeof window === 'undefined') return 1;
  if (window.matchMedia?.('(pointer: coarse)').matches) return 1;
  return 2;
}
