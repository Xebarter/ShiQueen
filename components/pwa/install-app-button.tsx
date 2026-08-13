'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  getInstallSurface,
  promptInstall,
  subscribeInstallAvailability,
  type InstallSurface,
} from '@/lib/pwa/install';
import {
  registerPartnerPushToken,
  requestPartnerNotificationPermission,
} from '@/lib/pwa/messaging';
import { unlockPartnerAudio } from '@/lib/pwa/sound';
import { cn } from '@/lib/utils';

function IosShareGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 16V5" />
      <path d="m8.5 8.5 3.5-3.5 3.5 3.5" />
      <path d="M5 11v8.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V11" />
    </svg>
  );
}

function GuideSteps({ surface }: { surface: InstallSurface }) {
  if (surface === 'ios-other') {
    return (
      <ol className="space-y-3 text-sm leading-relaxed text-foreground">
        <li>
          <span className="font-semibold">1. Open this page in Safari.</span>
          <p className="mt-1 text-muted-foreground">
            iPhone and iPad can only add the app from Safari — not Chrome, Firefox, or Instagram
            in-app browsers. Tap Share in this browser and choose <strong>Open in Safari</strong>,
            or copy the address and paste it in Safari.
          </p>
        </li>
        <li>
          <span className="font-semibold">2. Tap Share, then Add to Home Screen.</span>
          <p className="mt-1 text-muted-foreground">
            In Safari, tap the{' '}
            <IosShareGlyph className="inline-block h-4 w-4 align-text-bottom text-primary" /> Share
            button, scroll the list, then tap <strong>Add to Home Screen</strong> and <strong>Add</strong>.
          </p>
        </li>
      </ol>
    );
  }

  if (surface === 'ios-safari') {
    return (
      <ol className="space-y-3 text-sm leading-relaxed text-foreground">
        <li>
          <span className="font-semibold">1. Tap Share</span>
          <p className="mt-1 text-muted-foreground">
            On iPhone, tap the{' '}
            <IosShareGlyph className="inline-block h-4 w-4 align-text-bottom text-primary" /> button
            at the bottom of Safari. On iPad, it is in the top toolbar.
          </p>
        </li>
        <li>
          <span className="font-semibold">2. Add to Home Screen</span>
          <p className="mt-1 text-muted-foreground">
            Scroll the share sheet and tap <strong>Add to Home Screen</strong>. If you do not see
            it, tap <strong>Edit Actions</strong> and enable it.
          </p>
        </li>
        <li>
          <span className="font-semibold">3. Tap Add</span>
          <p className="mt-1 text-muted-foreground">
            Confirm the name, then tap <strong>Add</strong>. Open the new icon on your home screen
            for full-screen use and alerts.
          </p>
        </li>
      </ol>
    );
  }

  if (surface === 'android') {
    return (
      <ol className="space-y-3 text-sm leading-relaxed text-foreground">
        <li>
          <span className="font-semibold">1. Open the browser menu</span>
          <p className="mt-1 text-muted-foreground">
            In Chrome or Samsung Internet, tap the <strong>⋮</strong> menu in the top corner.
          </p>
        </li>
        <li>
          <span className="font-semibold">2. Install or Add to Home screen</span>
          <p className="mt-1 text-muted-foreground">
            Choose <strong>Install app</strong>, <strong>Add to Home screen</strong>, or{' '}
            <strong>Add page to → Home screen</strong>, then confirm.
          </p>
        </li>
      </ol>
    );
  }

  return (
    <ol className="space-y-3 text-sm leading-relaxed text-foreground">
      <li>
        <span className="font-semibold">Chrome or Edge</span>
        <p className="mt-1 text-muted-foreground">
          Click the install icon in the address bar, or open the browser menu and choose{' '}
          <strong>Install app</strong>.
        </p>
      </li>
      <li>
        <span className="font-semibold">Phone or tablet</span>
        <p className="mt-1 text-muted-foreground">
          On Android use Chrome and the ⋮ menu. On iPhone or iPad, open this page in Safari, tap
          Share, then <strong>Add to Home Screen</strong>.
        </p>
      </li>
    </ol>
  );
}

function InstallGuide({
  open,
  onClose,
  surface,
}: {
  open: boolean;
  onClose: () => void;
  surface: InstallSurface;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const title =
    surface === 'ios-safari' || surface === 'ios-other'
      ? 'Add to iPhone or iPad'
      : surface === 'android'
        ? 'Install on Android'
        : 'Install this app';

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close install instructions"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <h2 id={titleId} className="text-base font-semibold tracking-tight">
                {title}
              </h2>
              <p className="text-xs text-muted-foreground">Works best from your home screen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <GuideSteps surface={surface} />
        <Button className="mt-5 w-full" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>,
    document.body
  );
}

async function prepareInstall(uid?: string | null) {
  unlockPartnerAudio();
  await requestPartnerNotificationPermission();
  if (uid) {
    await registerPartnerPushToken(uid);
  }
}

type InstallAppButtonProps = {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  label?: string;
  variant?: 'default' | 'sidebar' | 'drawer';
};

export function InstallAppButton({
  className,
  size = 'default',
  label = 'Install app',
  variant = 'default',
}: InstallAppButtonProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => subscribeInstallAvailability(() => setTick((n) => n + 1)), []);
  useEffect(() => setReady(true), []);

  if (!ready) return null;

  const surface = getInstallSurface();
  if (surface === 'installed') return null;

  const handleClick = async () => {
    setBusy(true);
    try {
      await prepareInstall(user?.uid);
      if (surface === 'native') {
        const outcome = await promptInstall();
        if (outcome === 'unavailable') setGuideOpen(true);
        return;
      }
      setGuideOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const guide = (
    <InstallGuide open={guideOpen} onClose={() => setGuideOpen(false)} surface={surface} />
  );

  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={() => void handleClick()}
          disabled={busy}
          className={cn(
            'flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-primary transition hover:bg-primary/5 disabled:opacity-60',
            className
          )}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
          ) : (
            <Download className="h-5 w-5 shrink-0" />
          )}
          {label}
        </button>
        {guide}
      </>
    );
  }

  if (variant === 'drawer') {
    return (
      <>
        <button
          type="button"
          onClick={() => void handleClick()}
          disabled={busy}
          className={cn(
            'mb-1.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 text-[11px] font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-60 sm:h-9 sm:text-xs',
            className
          )}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {label}
        </button>
        {guide}
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        onClick={() => void handleClick()}
        disabled={busy}
        className={cn('gap-2', className)}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {label}
        <Smartphone className="h-3.5 w-3.5 opacity-70" />
      </Button>
      {guide}
    </>
  );
}
