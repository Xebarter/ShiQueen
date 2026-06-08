import { getPaytotaConfig } from '@/lib/paytota/config';
import { paytotaHttpFetch } from '@/lib/paytota/http';
import type {
  PaytotaCreatePurchasePayload,
  PaytotaExecuteResponse,
  PaytotaPurchaseResponse,
} from '@/lib/paytota/types';

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) {
        result[key] = stripUndefined(entry);
      }
    }
    return result as T;
  }
  return value;
}

export class PaytotaNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaytotaNetworkError';
  }
}

export function isPaytotaNetworkError(error: unknown): boolean {
  if (error instanceof PaytotaNetworkError) return true;
  if (error instanceof Error && error.message.includes('Could not reach Paytota')) return true;
  return isRetryableNetworkError(error);
}

function wrapPaytotaNetworkError(error: unknown): Error {
  if (!isRetryableNetworkError(error)) {
    return error instanceof Error ? error : new Error('Paytota request failed.');
  }

  const cause = error instanceof Error && 'cause' in error ? error.cause : null;
  const code =
    cause && typeof cause === 'object' && 'code' in cause
      ? String((cause as { code: unknown }).code)
      : error instanceof Error && 'code' in error
        ? String((error as NodeJS.ErrnoException).code)
        : '';

  const detail = code ? ` (${code})` : '';
  return new PaytotaNetworkError(
    `Could not reach Paytota${detail}. Check your internet connection, disable VPN if enabled, and confirm gate.paytota.com is accessible from your network.`
  );
}

function isRetryableNetworkError(error: unknown): boolean {
  const cause = error instanceof Error && 'cause' in error ? error.cause : null;
  const code =
    cause && typeof cause === 'object' && 'code' in cause
      ? String((cause as { code: unknown }).code)
      : '';

  return (
    error instanceof TypeError ||
    code.includes('TIMEOUT') ||
    code.includes('ENOTFOUND') ||
    code.includes('ECONNREFUSED') ||
    code.includes('ECONNRESET') ||
    code.includes('EAI_AGAIN')
  );
}

async function paytotaFetch<T>(path: string, init: RequestInit): Promise<T> {
  const { baseUrl, secretKey } = getPaytotaConfig();

  let response: Response;
  try {
    response = await paytotaHttpFetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        ...init.headers,
      },
    });
  } catch (error) {
    throw wrapPaytotaNetworkError(error);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : typeof data === 'object' &&
            data !== null &&
            'detail' in data &&
            typeof (data as { detail: unknown }).detail === 'string'
          ? (data as { detail: string }).detail
          : `Paytota request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export function normalizeUgandaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('256')) return digits;
  if (digits.startsWith('0')) return `256${digits.slice(1)}`;
  if (digits.length === 9) return `256${digits}`;
  return digits;
}

export async function createPaytotaPurchase(
  payload: Omit<PaytotaCreatePurchasePayload, 'brand_id'>
): Promise<PaytotaPurchaseResponse> {
  const { brandId } = getPaytotaConfig();

  return paytotaFetch<PaytotaPurchaseResponse>('/api/v1/purchases/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      stripUndefined({
        ...payload,
        brand_id: brandId,
        skip_capture: payload.skip_capture ?? false,
      })
    ),
  });
}

export async function executePaytotaStkPush(purchaseId: string): Promise<PaytotaExecuteResponse> {
  const { baseUrl } = getPaytotaConfig();
  const formData = new FormData();
  formData.append('s2s', 'true');
  formData.append('pm', 'paytota_proxy');

  let response: Response;
  try {
    response = await paytotaHttpFetch(`${baseUrl}/p/${purchaseId}/`, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    throw wrapPaytotaNetworkError(error);
  }

  const text = await response.text();
  let data: PaytotaExecuteResponse;
  try {
    data = JSON.parse(text) as PaytotaExecuteResponse;
  } catch {
    throw new Error('Invalid Paytota STK response');
  }

  if (!response.ok) {
    throw new Error(data.details?.message ?? `Paytota STK failed (${response.status})`);
  }

  return data;
}

export async function checkPaytotaConnectivity(): Promise<{
  ok: boolean;
  message: string;
}> {
  const { baseUrl } = getPaytotaConfig();

  try {
    const response = await paytotaHttpFetch(`${baseUrl}/api/v1/public_key/`, {
      method: 'GET',
    });
    if (response.ok) {
      return { ok: true, message: 'Paytota API is reachable.' };
    }
    return { ok: false, message: `Paytota API returned status ${response.status}.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Paytota API is unreachable.',
    };
  }
}
