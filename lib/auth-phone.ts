import type { User } from 'firebase/auth';
import { toE164UgandaPhone } from '@/lib/phone-utils';
import type { UserProfile } from '@/lib/types/database';

const AUTH_ROUTE_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/suppliers/sign-in',
  '/suppliers/sign-up',
  '/services/sign-in',
  '/services/sign-up',
];

export function isEmailOrGoogleSignIn(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.providerData.some(
    (provider) => provider.providerId === 'password' || provider.providerId === 'google.com'
  );
}

export function isAuthFlowPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === '/suppliers') return true;
  return AUTH_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function hasSavedAccountPhone(
  user: User | null | undefined,
  profile: UserProfile | null | undefined
): boolean {
  if (user?.phoneNumber) return true;
  return Boolean(toE164UgandaPhone(profile?.phone ?? ''));
}

export function shouldPromptForPhone(options: {
  user: User | null | undefined;
  profile: UserProfile | null | undefined;
  loading: boolean;
  pathname?: string | null;
}): boolean {
  const { user, profile, loading, pathname } = options;
  if (loading || !user || !profile) return false;
  if (isAuthFlowPath(pathname)) return false;
  if (!isEmailOrGoogleSignIn(user)) return false;
  return !hasSavedAccountPhone(user, profile);
}

export function isPhoneSignIn(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.providerData.some((provider) => provider.providerId === 'phone');
}

export function hasSavedAccountName(
  user: User | null | undefined,
  profile: UserProfile | null | undefined
): boolean {
  const name = (profile?.displayName || user?.displayName || '').trim();
  if (name.length < 2) return false;
  if (toE164UgandaPhone(name)) return false;
  if (/^\+?\d[\d\s-]{6,}$/.test(name)) return false;
  return true;
}

export function shouldPromptForName(options: {
  user: User | null | undefined;
  profile: UserProfile | null | undefined;
  loading: boolean;
  pathname?: string | null;
}): boolean {
  const { user, profile, loading, pathname } = options;
  if (loading || !user || !profile) return false;
  if (isAuthFlowPath(pathname)) return false;
  if (!isPhoneSignIn(user)) return false;
  return !hasSavedAccountName(user, profile);
}
