import dns from 'node:dns';
import https from 'node:https';
import { URL } from 'node:url';

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const REQUEST_TIMEOUT_MS = Number(process.env.PAYTOTA_REQUEST_TIMEOUT_MS ?? 60_000);
const MAX_RETRIES = Number(process.env.PAYTOTA_MAX_RETRIES ?? 3);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const code = 'code' in error ? String((error as NodeJS.ErrnoException).code) : '';
  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    error.message.includes('timeout')
  );
}

type PaytotaHttpOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
};

function formDataToBuffer(formData: FormData): { body: Buffer; contentType: string } {
  const boundary = `----PaytotaBoundary${Date.now()}`;
  const chunks: Buffer[] = [];

  for (const [key, value] of formData.entries()) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(
      Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n${String(value)}\r\n`)
    );
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    body: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

function httpsRequest(url: string, options: PaytotaHttpOptions): Promise<Response> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    let bodyBuffer: Buffer | undefined;
    const headers: Record<string, string> = { ...options.headers };

    if (options.body instanceof FormData) {
      const encoded = formDataToBuffer(options.body);
      bodyBuffer = encoded.body;
      headers['Content-Type'] = encoded.contentType;
      headers['Content-Length'] = String(bodyBuffer.length);
    } else if (typeof options.body === 'string') {
      bodyBuffer = Buffer.from(options.body);
      headers['Content-Length'] = String(bodyBuffer.length);
    }

    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: options.method ?? 'GET',
        headers,
        family: 4,
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve(
            new Response(text, {
              status: res.statusCode ?? 500,
              headers: res.headers as HeadersInit,
            })
          );
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`Paytota request timed out after ${REQUEST_TIMEOUT_MS}ms`));
    });
    req.on('error', reject);

    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}

export async function paytotaHttpFetch(
  url: string,
  init: RequestInit & { body?: BodyInit | null }
): Promise<Response> {
  let lastError: unknown;

  const headers: Record<string, string> = {};
  if (init.headers) {
    const headerEntries =
      init.headers instanceof Headers
        ? Array.from(init.headers.entries())
        : Object.entries(init.headers as Record<string, string>);
    for (const [key, value] of headerEntries) {
      if (typeof value === 'string') headers[key] = value;
    }
  }

  const body =
    init.body instanceof FormData || typeof init.body === 'string' ? init.body : undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await httpsRequest(url, {
        method: init.method,
        headers,
        body,
      });
    } catch (error) {
      lastError = error;
      console.warn(`[ShiQueen] Paytota request attempt ${attempt}/${MAX_RETRIES} failed:`, error);

      if (!isRetryableNetworkError(error) || attempt === MAX_RETRIES) {
        break;
      }

      await sleep(attempt * 1500);
    }
  }

  throw lastError;
}
