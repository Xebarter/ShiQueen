export function normalizeUgandaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('256')) return digits;
  if (digits.startsWith('0')) return `256${digits.slice(1)}`;
  if (digits.length === 9) return `256${digits}`;
  return digits;
}

/** Uganda mobile: 256 + 7 + 8 digits. Returns E.164 or null. */
export function toE164UgandaPhone(phone: string): string | null {
  const digits = normalizeUgandaPhone(phone);
  if (!/^2567\d{8}$/.test(digits)) return null;
  return `+${digits}`;
}

export function formatE164Display(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('256') && digits.length === 12) {
    return `+256 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (phone.startsWith('+')) return phone;
  return digits ? `+${digits}` : phone;
}

export function formatNationalMobileInput(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('256')) digits = digits.slice(3);
  digits = digits.replace(/^0+/, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
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
