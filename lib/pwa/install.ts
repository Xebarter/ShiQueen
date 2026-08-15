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

if (typeof window !== 'undefined') {
  bindInstallPromptListener();
}

function waitForDeferredPrompt(ms: number) {
  if (deferredPrompt) return Promise.resolve();
  bindInstallPromptListener();
  return new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timer);
      promptListeners.delete(onChange);
      resolve();
    };
    const onChange = () => {
      if (deferredPrompt) finish();
    };
    promptListeners.add(onChange);
    const timer = window.setTimeout(finish, ms);
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
  const iosStandalone =
    'standalone' in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standalone || iosStandalone;
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const inApp = /FBAN|FBAV|Instagram|Line\/|Twitter|MicroMessenger/i.test(ua);
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/.test(ua);
  return isIosDevice() && webkit && !inApp;
}

export type InstallSurface =
  | 'installed'
  | 'native'
  | 'ios-safari'
  | 'ios-other'
  | 'android'
  | 'desktop';

export function getInstallSurface(): InstallSurface {
  if (isStandaloneDisplay()) return 'installed';
  if (canPromptInstall()) return 'native';
  if (isIosSafari()) return 'ios-safari';
  if (isIosDevice()) return 'ios-other';
  if (isAndroidDevice()) return 'android';
  return 'desktop';
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
  if (!deferredPrompt) {
    await waitForDeferredPrompt(2500);
  }
  if (!deferredPrompt) return 'unavailable';
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome;
}
