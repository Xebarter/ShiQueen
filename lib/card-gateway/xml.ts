export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function xmlTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return (match?.[1] ?? '').trim();
}

export function formatGatewayDate(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function splitPersonName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Customer', lastName: 'ShiQueen' };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: 'Customer' };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') };
}

export function formatPaymentAmount(amount: number): string {
  return Math.max(0, Number(amount) || 0).toFixed(2);
}

export function xmlLeaf(tag: string, value: string | undefined, indent = '    '): string {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  return `\n${indent}<${tag}>${escapeXml(trimmed)}</${tag}>`;
}

export function xmlToFields(xml: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const re = /<([A-Za-z][\w]*)>([^<]*)<\/\1>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const value = match[2]?.trim();
    if (value) fields[match[1]!] = value;
  }
  return fields;
}
