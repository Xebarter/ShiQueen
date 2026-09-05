/** ShiQueen public contact details — used in footer, contact page, WhatsApp CTAs. */
export const CONTACT_PHONE_E164 = '+256750225159';
export const CONTACT_PHONE_DIGITS = '256750225159';
export const CONTACT_PHONE_DISPLAY = '+256 750 225159';
export const CONTACT_TIKTOK_HREF = 'https://www.tiktok.com/@shiqueen_ug';

export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE_E164}`;

export function contactWhatsAppHref(message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${CONTACT_PHONE_DIGITS}${text}`;
}
