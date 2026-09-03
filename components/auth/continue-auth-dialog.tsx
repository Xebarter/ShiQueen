'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Loader2, Lock, Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthDivider } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { PasswordField } from '@/components/auth/password-field';
import { PhoneSignIn } from '@/components/auth/phone-sign-in';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { withAuthNext } from '@/lib/auth-redirect';
import { useHistoryOverlay } from '@/lib/hooks/use-history-overlay';
import { cn } from '@/lib/utils';

export type ContinueAuthIntent = 'order' | 'payment-link' | 'booking';

const COPY: Record<ContinueAuthIntent, { title: string; description: string }> = {
  order: {
    title: 'Sign in to complete checkout',
    description:
      'Your order, delivery details, and receipts stay on your ShiQueen account.',
  },
  'payment-link': {
    title: 'Sign in to share a payment link',
    description:
      'We attach the link to your account so the order is yours after someone else pays.',
  },
  booking: {
    title: 'Sign in to confirm your booking',
    description: 'Your appointment and payment stay on your ShiQueen account.',
  },
};

type EmailStep = 'identify' | 'password';

export function useContinueAuthPrompt() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<ContinueAuthIntent>('order');

  useEffect(() => {
    if (user && open) setOpen(false);
  }, [user, open]);

  const requireAuth = useCallback(
    (nextIntent: ContinueAuthIntent = 'order') => {
      if (loading) return false;
      if (user) return true;
      setIntent(nextIntent);
      setOpen(true);
      return false;
    },
    [loading, user]
  );

  return {
    user,
    authLoading: loading,
    authPromptOpen: open,
    setAuthPromptOpen: setOpen,
    authIntent: intent,
    requireAuth,
  };
}

type ContinueAuthDialogProps = {
  open: boolean;
  onClose: () => void;
  intent?: ContinueAuthIntent;
  nextPath?: string;
};

export function ContinueAuthDialog({
  open,
  onClose,
  intent = 'order',
  nextPath,
}: ContinueAuthDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const { signInOrCreate, signInWithGoogle, refreshProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<EmailStep>('identify');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);

  useHistoryOverlay(open, onClose);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setEmailOpen(false);
      setEmailStep('identify');
      setPassword('');
      setLoading(false);
      setGoogleLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const isBusy = loading || googleLoading || phoneBusy;
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const copy = COPY[intent];
  const signInHref = withAuthNext('/sign-in', nextPath);
  const signUpHref = withAuthNext('/sign-up', nextPath);

  const finish = async (created: boolean) => {
    await refreshProfile();
    toast.success(created ? 'Account created' : 'You’re signed in');
    onClose();
  };

  const handlePhoneSuccess = async ({ created }: { created: boolean }) => {
    await finish(created);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      await finish(false);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleIdentify = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!emailIsValid) {
      toast.error('Enter a valid email address');
      return;
    }
    setEmailStep('password');
  };

  const handleEmailContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { created } = await signInOrCreate(email.trim(), password);
      await finish(created);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-hidden
        className="absolute inset-0 bg-[oklch(0.22_0.04_340_/_0.55)] backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 max-h-[min(92dvh,40rem)] w-full max-w-[26.5rem] overflow-y-auto overflow-x-hidden rounded-2xl border border-white/70 bg-card/95 shadow-[0_28px_80px_-28px_oklch(0.28_0.08_340_/_0.55)] ring-1 ring-black/[0.04] backdrop-blur-xl"
      >
        <div
          aria-hidden
          className="h-1 w-full bg-gradient-to-r from-primary via-primary to-accent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,oklch(0.74_0.12_62_/_0.18),transparent_70%)]"
        />

        <div className="relative px-5 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-5 pr-8">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_28px_-12px_oklch(0.40_0.13_340_/_0.7)]">
              <Lock className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-brand)] text-[1.55rem] font-medium leading-tight tracking-tight text-foreground"
            >
              {copy.title}
            </h2>
            <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {copy.description}
            </p>
          </div>

          <div className="space-y-4">
            <PhoneSignIn
              disabled={loading || googleLoading}
              onBusyChange={setPhoneBusy}
              onSuccess={handlePhoneSuccess}
            />

            <AuthDivider />

            <GoogleSignInButton
              loading={googleLoading}
              disabled={isBusy}
              onClick={() => void handleGoogleSignIn()}
              label="Continue with Google"
            />

            {emailOpen ? (
              emailStep === 'identify' ? (
                <form onSubmit={handleIdentify} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="continue-auth-email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="continue-auth-email"
                      type="email"
                      autoComplete="username email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-11 rounded-xl text-base md:text-sm"
                      required
                      disabled={isBusy}
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-11 w-full rounded-xl text-sm font-semibold"
                    disabled={isBusy || !emailIsValid}
                  >
                    Continue with email
                  </Button>
                </form>
              ) : (
                <form onSubmit={(event) => void handleEmailContinue(event)} className="space-y-4">
                  <div className="rounded-xl border border-border/70 bg-muted/25 px-3.5 py-3">
                    <p className="text-xs text-muted-foreground">Signing in as</p>
                    <div className="mt-0.5 flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold">{email}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailStep('identify');
                          setPassword('');
                        }}
                        className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                        disabled={isBusy}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="continue-auth-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <PasswordField
                      id="continue-auth-password"
                      value={password}
                      onChange={setPassword}
                      disabled={isBusy}
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-11 w-full rounded-xl text-sm font-semibold"
                    disabled={isBusy || !password}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Continue
                      </>
                    ) : (
                      'Continue with email'
                    )}
                  </Button>
                </form>
              )
            ) : (
              <button
                type="button"
                onClick={() => setEmailOpen(true)}
                disabled={isBusy}
                className={cn(
                  'flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-background px-4',
                  'text-sm font-semibold text-foreground shadow-sm transition',
                  'hover:border-border hover:bg-muted/40',
                  'disabled:pointer-events-none disabled:opacity-50'
                )}
              >
                <Mail className="h-[18px] w-[18px] shrink-0" />
                Continue with email
              </button>
            )}
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            New here?{' '}
            <Link
              href={signUpHref}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
            {' · '}
            <Link
              href={signInHref}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Full sign-in page
            </Link>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
