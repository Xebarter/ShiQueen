'use client';

import { useEffect, useRef, useState } from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import {
  formatE164Display,
  formatNationalMobileInput,
  toE164UgandaPhone,
} from '@/lib/phone-utils';

const RESEND_SECONDS = 45;

type PhoneSignInProps = {
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onSuccess: (result: { created: boolean }) => Promise<void> | void;
};

export function PhoneSignIn({ disabled = false, onBusyChange, onSuccess }: PhoneSignInProps) {
  const { finishPhoneSignIn } = useAuth();
  const recaptchaHostRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [nationalNumber, setNationalNumber] = useState('');
  const [e164, setE164] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const setBusy = (next: boolean) => {
    setLoading(next);
    onBusyChange?.(next);
  };

  const phoneIsValid = Boolean(toE164UgandaPhone(nationalNumber));
  const codeIsValid = /^\d{6}$/.test(code);
  const busy = disabled || loading;

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, []);

  const getVerifier = () => {
    const auth = getFirebaseAuth();
    const host = recaptchaHostRef.current;
    if (!auth || !host) {
      throw Object.assign(new Error('Phone verification is not ready yet.'), {
        code: 'auth/invalid-app-credential',
      });
    }
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, host, { size: 'invisible' });
    }
    return verifierRef.current;
  };

  const resetVerifier = () => {
    verifierRef.current?.clear();
    verifierRef.current = null;
  };

  const sendCode = async (phoneE164: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');
    try {
      const result = await signInWithPhoneNumber(auth, phoneE164, getVerifier());
      setConfirmation(result);
      setE164(phoneE164);
      setStep('code');
      setCode('');
      setResendIn(RESEND_SECONDS);
    } catch (error) {
      resetVerifier();
      throw error;
    }
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const phoneE164 = toE164UgandaPhone(nationalNumber);
    if (!phoneE164) {
      toast.error('Enter a valid Uganda mobile number, like 07XX XXX XXX.');
      return;
    }
    setBusy(true);
    try {
      await sendCode(phoneE164);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || !e164) return;
    setBusy(true);
    try {
      await sendCode(e164);
      toast.success('A new code is on the way');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!confirmation || !codeIsValid) {
      toast.error('Enter the 6-digit code from SMS.');
      return;
    }
    setBusy(true);
    try {
      const credential = await confirmation.confirm(code);
      const { created } = await finishPhoneSignIn(
        credential.user,
        credential.additionalUserInfo?.isNewUser
      );
      await onSuccess({ created });
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {step === 'phone' ? (
        <form onSubmit={handleSend} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone number
            </Label>
            <div className="flex h-11 overflow-hidden rounded-xl border border-input bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span className="flex shrink-0 items-center border-r border-input bg-muted/40 px-3 text-sm font-semibold text-foreground">
                +256
              </span>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="7XX XXX XXX"
                value={nationalNumber}
                onChange={(event) => setNationalNumber(formatNationalMobileInput(event.target.value))}
                className="h-11 rounded-none border-0 text-base shadow-none focus-visible:ring-0 md:text-sm"
                required
                disabled={busy}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We’ll text a 6-digit code. Standard SMS rates may apply.
            </p>
          </div>

          <Button
            type="submit"
            className="h-11 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/15"
            disabled={busy || !phoneIsValid}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending code…
              </>
            ) : (
              'Continue with phone'
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="rounded-xl border border-border/70 bg-muted/25 px-3.5 py-3">
            <p className="text-xs text-muted-foreground">Code sent to</p>
            <div className="mt-0.5 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-foreground">
                {formatE164Display(e164)}
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setConfirmation(null);
                  setCode('');
                }}
                className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                disabled={busy}
              >
                Change
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="otp" className="text-sm font-medium text-foreground">
              Verification code
            </Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="h-11 rounded-xl text-center text-lg tracking-[0.4em] md:text-base"
              required
              disabled={busy}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {resendIn > 0 ? (
                `Resend code in ${resendIn}s`
              ) : (
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  disabled={busy}
                >
                  Resend code
                </button>
              )}
            </p>
          </div>

          <Button
            type="submit"
            className="h-11 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/15"
            disabled={busy || !codeIsValid}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              'Verify and continue'
            )}
          </Button>
        </form>
      )}
      <div ref={recaptchaHostRef} />
    </div>
  );
}
