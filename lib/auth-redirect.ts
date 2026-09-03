import type { UserProfile } from '@/lib/types/database';

export function getPostAuthPath(profile: UserProfile | null | undefined): string {
  if (!profile) return '/account';
  if (profile.role === 'admin') return '/admin';

  const isSupplier = Boolean(profile.supplierId) || profile.role === 'supplier';
  const isProvider =
    Boolean(profile.providerId) || profile.role === 'service_provider';

  if (isSupplier && isProvider) return '/account';
  if (isSupplier) return '/suppliers/orders';
  if (isProvider) return '/services/dashboard/bookings';
  return '/account';
}

export function isSupplierProfile(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(profile.supplierId) || profile.role === 'supplier';
}

export function isServiceProviderProfile(
  profile: UserProfile | null | undefined
): boolean {
  if (!profile) return false;
  return Boolean(profile.providerId) || profile.role === 'service_provider';
}

/** Same-origin relative path after sign-in. Rejects protocol-relative and auth loops. */
export function getSafeAuthNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  const trimmed = next.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.includes('://')) return null;
  if (trimmed.startsWith('/sign-in') || trimmed.startsWith('/sign-up')) return null;
  if (trimmed.startsWith('/services/sign-in') || trimmed.startsWith('/suppliers/sign-in')) {
    return null;
  }
  return trimmed;
}

export function withAuthNext(href: string, next: string | null | undefined): string {
  const safe = getSafeAuthNextPath(next);
  if (!safe) return href;
  const join = href.includes('?') ? '&' : '?';
  return `${href}${join}next=${encodeURIComponent(safe)}`;
}
