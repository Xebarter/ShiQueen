'use client';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'shequeen-pwa-install-dismissed';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listenersBound = false;
const promptListeners = new Set<() => void>();

function notify() {
  promptListeners.forEach((fn) => fn());
}

export function bindInstallPromptListener() {
  if (typeof window === 'undefined' || listenersBound) return;
  listenersBound = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export function subscribeInstallAvailability(onChange: () => void) {
  bindInstallPromptListener();
  promptListeners.add(onChange);
  return () => {
    promptListeners.delete(onChange);
  };
}

export function canPromptInstall() {
  return Boolean(deferredPrompt);
}

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = 'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standalone || iosStandalone;
}

export function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit;
}

export function wasInstallDismissed() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DISMISS_KEY) === '1';
}

export function dismissInstallCard() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DISMISS_KEY, '1');
  notify();
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome;
}
