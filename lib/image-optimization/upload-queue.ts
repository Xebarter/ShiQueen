import type { ProductImageUploadResult } from '@/lib/image-optimization/types';
import { IMAGE_OPTIMIZATION, getUploadConcurrency } from '@/lib/image-optimization/config';

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  iteratee: (item: T, index: number, signal: AbortSignal) => Promise<R>,
  signal?: AbortSignal
): Promise<R[]> {
  const limit = Math.max(1, concurrency);
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      if (signal?.aborted) throw new DOMException('Upload cancelled.', 'AbortError');
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await iteratee(items[index], index, signal ?? new AbortController().signal);
    }
  });

  await Promise.all(workers);
  return results;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Upload cancelled.', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        reject(new DOMException('Upload cancelled.', 'AbortError'));
      },
      { once: true }
    );
  });
}

function shouldRetryStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

export class UploadRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'UploadRequestError';
    this.status = status;
  }
}

export function uploadFormDataWithProgress(options: {
  url: string;
  token: string;
  formData: FormData;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}): Promise<unknown> {
  const { url, token, formData, signal, onProgress } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'json';

    const onAbort = () => {
      xhr.abort();
    };
    signal?.addEventListener('abort', onAbort);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
      onProgress?.(percent);
    };

    xhr.onerror = () => {
      signal?.removeEventListener('abort', onAbort);
      reject(new Error('Network error while uploading. Check your connection and try again.'));
    };

    xhr.onabort = () => {
      signal?.removeEventListener('abort', onAbort);
      reject(new DOMException('Upload cancelled.', 'AbortError'));
    };

    xhr.onload = () => {
      signal?.removeEventListener('abort', onAbort);
      const payload =
        typeof xhr.response === 'object' && xhr.response !== null
          ? xhr.response
          : (() => {
              try {
                return JSON.parse(xhr.responseText) as unknown;
              } catch {
                return {};
              }
            })();

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(payload);
        return;
      }

      const message =
        payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : 'Failed to upload image.';
      reject(new UploadRequestError(message, xhr.status));
    };

    xhr.send(formData);
  });
}

export async function uploadFormDataWithRetry(options: {
  url: string;
  token: string;
  formData: FormData;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= IMAGE_OPTIMIZATION.retries; attempt += 1) {
    if (options.signal?.aborted) {
      throw new DOMException('Upload cancelled.', 'AbortError');
    }
    try {
      return await uploadFormDataWithProgress(options);
    } catch (error) {
      lastError = error;
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      const status = error instanceof UploadRequestError ? error.status : 0;
      const retryable = !(error instanceof UploadRequestError) || shouldRetryStatus(status);
      if (!retryable || attempt === IMAGE_OPTIMIZATION.retries) throw error;
      await delay(IMAGE_OPTIMIZATION.retryBaseDelayMs * (attempt + 1), options.signal);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to upload image.');
}

export function parseProductImageUploadResponse(payload: unknown): ProductImageUploadResult {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Upload succeeded but no image URL was returned.');
  }
  const data = payload as Record<string, unknown>;
  if (typeof data.url !== 'string' || !data.url) {
    throw new Error('Upload succeeded but no image URL was returned.');
  }

  const variantsRaw = data.variants;
  const variants =
    variantsRaw && typeof variantsRaw === 'object'
      ? {
          src: typeof (variantsRaw as { src?: unknown }).src === 'string' ? (variantsRaw as { src: string }).src : data.url,
          card: typeof (variantsRaw as { card?: unknown }).card === 'string' ? (variantsRaw as { card: string }).card : data.url,
          thumb: typeof (variantsRaw as { thumb?: unknown }).thumb === 'string' ? (variantsRaw as { thumb: string }).thumb : data.url,
          zoom: typeof (variantsRaw as { zoom?: unknown }).zoom === 'string' ? (variantsRaw as { zoom: string }).zoom : data.url,
        }
      : { src: data.url, card: data.url, thumb: data.url, zoom: data.url };

  return {
    url: data.url,
    variants,
    bytes: typeof data.bytes === 'number' ? data.bytes : 0,
    width: typeof data.width === 'number' ? data.width : 0,
    height: typeof data.height === 'number' ? data.height : 0,
    format: data.format === 'jpeg' ? 'jpeg' : 'webp',
    hash: typeof data.hash === 'string' ? data.hash : '',
    duplicate: Boolean(data.duplicate),
  };
}

export { getUploadConcurrency };
