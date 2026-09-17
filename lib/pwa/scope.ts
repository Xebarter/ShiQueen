'use client';

import { isStandaloneDisplay } from '@/lib/pwa/install';
import {
  ADMIN_HOME_HREF,
  ADMIN_SIGN_IN_HREF,
  PROVIDER_HOME_HREF,
  PROVIDER_SIGN_IN_HREF,
  SUPPLIER_HOME_HREF,
  SUPPLIER_SIGN_IN_HREF,
} from '@/lib/pwa/paths';

export type PartnerPwaApp = 'admin' | 'supplier' | 'provider';

const APP_KEY = 'sq-pwa-app';
const LAUNCHED_KEY = 'sq-pwa-launched';

const PWA_HOMES: Record<PartnerPwaApp, string> = {
  admin: ADMIN_HOME_HREF,
  supplier: SUPPLIER_HOME_HREF,
  provider: PROVIDER_HOME_HREF,
};

const PWA_SIGN_IN: Record<PartnerPwaApp, string> = {
  admin: ADMIN_SIGN_IN_HREF,
  supplier: SUPPLIER_SIGN_IN_HREF,
  provider: PROVIDER_SIGN_IN_HREF,
};

const PWA_PREFIXES: Record<PartnerPwaApp, readonly string[]> = {
  admin: ['/admin'],
  supplier: ['/suppliers'],
  provider: ['/services/dashboard', '/services/sign-in', '/services/sign-up'],
};

function stripPath(path: string) {
  const trimmed = path.trim();
  if (!trimmed) return '/';
  return trimmed.split('?')[0].split('#')[0] || '/';
}

function pathMatchesPrefix(pathname: string, prefix: string) {
  const path = stripPath(pathname);
  const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  return path === base || path.startsWith(`${base}/`);
}

export function getPartnerPwaHome(app: PartnerPwaApp) {
  return PWA_HOMES[app];
}

export function getPartnerPwaSignIn(app: PartnerPwaApp) {
  return PWA_SIGN_IN[app];
}

export function isPathInPwaScope(app: PartnerPwaApp, pathname: string) {
  if (PWA_PREFIXES[app].some((prefix) => pathMatchesPrefix(pathname, prefix))) return true;
  return pathMatchesPrefix(pathname, '/forgot-password');
}

export function detectPwaAppFromPath(pathname: string): PartnerPwaApp | null {
  const path = stripPath(pathname);
  if (pathMatchesPrefix(path, '/admin')) return 'admin';
  if (pathMatchesPrefix(path, '/suppliers')) return 'supplier';
  if (pathMatchesPrefix(path, '/services/dashboard')) return 'provider';
  if (pathMatchesPrefix(path, '/services/sign-in') || pathMatchesPrefix(path, '/services/sign-up')) {
    return 'provider';
  }
  return null;
}

function readStoredApp(): PartnerPwaApp | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.sessionStorage.getItem(APP_KEY);
    if (value === 'admin' || value === 'supplier' || value === 'provider') return value;
  } catch {
    // ignore
  }
  return null;
}

export function rememberPartnerPwaApp(app: PartnerPwaApp) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(APP_KEY, app);
  } catch {
    // ignore
  }
}

export function resolveStandalonePartnerApp(pathname: string): PartnerPwaApp | null {
  const fromPath = detectPwaAppFromPath(pathname);
  if (fromPath) {
    rememberPartnerPwaApp(fromPath);
    return fromPath;
  }
  return readStoredApp();
}

export function wasPwaSessionLaunched() {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(LAUNCHED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPwaSessionLaunched() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(LAUNCHED_KEY, '1');
  } catch {
    // ignore
  }
}

export function isStandalonePartnerPwa(pathname?: string) {
  if (!isStandaloneDisplay()) return false;
  const path = pathname ?? (typeof window === 'undefined' ? '/' : window.location.pathname);
  return resolveStandalonePartnerApp(path) !== null;
}

export function shouldMarkHomeAfterLogout() {
  if (typeof window === 'undefined') return true;
  if (isStandaloneDisplay()) return false;
  return detectPwaAppFromPath(window.location.pathname) === null;
}

export function openInSystemBrowser(href: string) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(href, window.location.href).href;
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened) opened.opener = null;
  } catch {
    // ignore
  }
}

export function toAbsoluteSameOriginUrl(href: string): URL | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return url;
  } catch {
    return null;
  }
}
