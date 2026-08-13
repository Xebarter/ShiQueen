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
