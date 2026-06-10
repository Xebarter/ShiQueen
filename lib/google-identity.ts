export type GoogleCredentialResponse = {
  credential: string;
  select_by?: string;
  clientId?: string;
};

type PromptMomentNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
};

type GoogleOneTapConfig = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  itp_support?: boolean;
  use_fedcm_for_prompt?: boolean;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleOneTapConfig) => void;
          prompt: (momentListener?: (notification: PromptMomentNotification) => void) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

export function getGoogleClientId(): string | undefined {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return clientId || undefined;
}

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Identity Services failed to load')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services failed to load'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function disableGoogleOneTapAutoSelect(): void {
  window.google?.accounts?.id?.disableAutoSelect();
}

export function cancelGoogleOneTapPrompt(): void {
  window.google?.accounts?.id?.cancel();
}
