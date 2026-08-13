'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthGuestOnly } from '@/components/auth/auth-guest-only';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { PasswordField } from '@/components/auth/password-field';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

type Step = 'identify' | 'password';

export default function SignIn() {
  const [step, setStep] = useState<Step>('identify');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signInOrCreate, signInWithGoogle, refreshProfile } = useAuth();
  const router = useRouter();

  const isBusy = loading || googleLoading;
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const goAfterAuth = async () => {
    await refreshProfile();
    const { getUserProfile } = await import('@/lib/firebase/users');
    const { getFirebaseAuth } = await import('@/lib/firebase');
    const uid = getFirebaseAuth()?.currentUser?.uid;
    const profile = uid ? await getUserProfile(uid) : null;
    router.push(getPostAuthPath(profile));
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      await goAfterAuth();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
      console.error(error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailIsValid) {
      toast.error('Enter a valid email address');
      return;
    }
    setStep('password');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);

    try {
      const { created } = await signInOrCreate(email.trim(), password);
      toast.success(created ? 'Account created' : 'Welcome back');
      await goAfterAuth();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell heading="Sign in">
      <AuthGuestOnly>
      <div className="space-y-5">
        <GoogleSignInButton
          loading={googleLoading}
          disabled={isBusy}
          onClick={handleGoogleSignIn}
          label="Continue with Google"
        />

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-xs text-muted-foreground">or</span>
          </div>
        </div>

        {step === 'identify' ? (
          <form onSubmit={handleIdentify} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-normal text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="username email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-md text-base md:text-sm"
                required
                disabled={isBusy}
                autoFocus
              />
            </div>

            <div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className="text-sm font-medium text-primary hover:underline"
              >
                Create account
              </Link>
              <Button type="submit" className="h-10 min-w-[88px] px-6" disabled={isBusy || !emailIsValid}>
                Next
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Signing in as</p>
              <div className="mt-0.5 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-foreground">{email}</p>
                <button
                  type="button"
                  onClick={() => {
                    setStep('identify');
                    setPassword('');
                  }}
                  className="shrink-0 text-sm font-medium text-primary hover:underline"
                  disabled={isBusy}
                >
                  Change
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password" className="text-sm font-normal text-foreground">
                  Enter your password
                </Label>
              </div>
              <PasswordField
                id="password"
                value={password}
                onChange={setPassword}
                disabled={isBusy}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                New here? We’ll create an account with this email and password.{' '}
                <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </p>
            </div>

            <div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className="text-sm font-medium text-primary hover:underline"
              >
                Create account
              </Link>
              <Button type="submit" className="h-10 min-w-[88px] px-6" disabled={isBusy || !password}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Continue
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
      </AuthGuestOnly>
    </AuthShell>
  );
}
