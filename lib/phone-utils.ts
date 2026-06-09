export function normalizeUgandaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('256')) return digits;
  if (digits.startsWith('0')) return `256${digits.slice(1)}`;
  if (digits.length === 9) return `256${digits}`;
  return digits;
}

export function buildTelLink(phone: string): string {
  const normalized = normalizeUgandaPhone(phone).replace(/\s/g, '');
  return `tel:+${normalized}`;
}

export function buildWhatsAppLink(phone: string, message?: string): string {
  const digits = normalizeUgandaPhone(phone).replace(/\D/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}
