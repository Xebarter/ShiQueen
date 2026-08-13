import { NextRequest } from 'next/server';
import { collectCardCallbackFields } from '@/lib/card-gateway/settle';
import { xmlToFields } from '@/lib/card-gateway/xml';

async function parseBody(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      return (await request.json()) as Record<string, unknown>;
    }
    if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const form = await request.formData();
      return Object.fromEntries(
        [...form.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : ''])
      );
    }

    const text = await request.text();
    if (!text.trim()) return {};

    if (contentType.includes('xml') || text.trim().startsWith('<')) {
      return xmlToFields(text);
    }

    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return Object.fromEntries(new URLSearchParams(text));
    }
  } catch {
    return {};
  }
}

function mergeXmlFields(body: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...body };
  for (const value of Object.values(body)) {
    if (typeof value === 'string' && value.includes('<') && value.includes('>')) {
      Object.assign(merged, xmlToFields(value));
    }
  }
  return merged;
}

export async function parseCardGatewayRequest(request: NextRequest): Promise<{
  transToken?: string;
  companyRef?: string;
}> {
  const body = request.method === 'GET' ? {} : mergeXmlFields(await parseBody(request));
  return collectCardCallbackFields(request.nextUrl.searchParams, body);
}
