import { formatE164Display } from '@/lib/phone-utils';

export function getDisplayName(
  displayName?: string | null,
  email?: string | null,
  phone?: string | null
): string {
  if (displayName?.trim()) return displayName.trim();
  if (email) return email.split('@')[0] ?? 'Member';
  if (phone?.trim()) return formatE164Display(phone);
  return 'Member';
}

export function normalizePersonName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function getAccountHandle(
  email?: string | null,
  phone?: string | null
): string {
  if (email?.trim()) return email.trim();
  if (phone?.trim()) return formatE164Display(phone);
  return 'Account';
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** First letter of the name, else email local-part, else last digit of a phone. */
export function getEmailInitial(
  email?: string | null,
  phone?: string | null,
  name?: string | null
): string {
  const nameMatch = name?.trim().match(/[a-zA-Z]/);
  if (nameMatch) return nameMatch[0].toUpperCase();
  if (email?.trim()) {
    const local = email.trim().split('@')[0] || email.trim();
    const match = local.match(/[a-zA-Z0-9]/);
    return match ? match[0].toUpperCase() : '?';
  }
  const digits = phone?.replace(/\D/g, '') ?? '';
  if (digits) return digits.slice(-1);
  return '?';
}

/** Google-style bright avatar colors — stable per letter. */
const LETTER_AVATAR_COLORS = [
  { background: '#1A73E8', foreground: '#FFFFFF' }, // A
  { background: '#E52592', foreground: '#FFFFFF' }, // B
  { background: '#9334E6', foreground: '#FFFFFF' }, // C
  { background: '#D93025', foreground: '#FFFFFF' }, // D
  { background: '#188038', foreground: '#FFFFFF' }, // E
  { background: '#F9AB00', foreground: '#202124' }, // F
  { background: '#E37400', foreground: '#FFFFFF' }, // G
  { background: '#0B8043', foreground: '#FFFFFF' }, // H
  { background: '#039BE5', foreground: '#FFFFFF' }, // I
  { background: '#7986CB', foreground: '#FFFFFF' }, // J
  { background: '#F4511E', foreground: '#FFFFFF' }, // K
  { background: '#4285F4', foreground: '#FFFFFF' }, // L
  { background: '#AB47BC', foreground: '#FFFFFF' }, // M
  { background: '#00ACC1', foreground: '#FFFFFF' }, // N
  { background: '#7CB342', foreground: '#FFFFFF' }, // O
  { background: '#5C6BC0', foreground: '#FFFFFF' }, // P
  { background: '#8E24AA', foreground: '#FFFFFF' }, // Q
  { background: '#EF5350', foreground: '#FFFFFF' }, // R
  { background: '#26A69A', foreground: '#FFFFFF' }, // S
  { background: '#FF7043', foreground: '#FFFFFF' }, // T
  { background: '#EC407A', foreground: '#FFFFFF' }, // U
  { background: '#29B6F6', foreground: '#FFFFFF' }, // V
  { background: '#66BB6A', foreground: '#FFFFFF' }, // W
  { background: '#FFA726', foreground: '#202124' }, // X
  { background: '#5E35B1', foreground: '#FFFFFF' }, // Y
  { background: '#43A047', foreground: '#FFFFFF' }, // Z
] as const;

export function getAvatarColorsForLetter(letter: string): {
  background: string;
  foreground: string;
} {
  const upper = letter.toUpperCase();
  const code = upper.charCodeAt(0);

  if (code >= 65 && code <= 90) {
    return LETTER_AVATAR_COLORS[code - 65];
  }

  if (code >= 48 && code <= 57) {
    return LETTER_AVATAR_COLORS[code - 48];
  }

  return LETTER_AVATAR_COLORS[code % LETTER_AVATAR_COLORS.length];
}
