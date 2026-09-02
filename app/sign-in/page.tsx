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
import { AuthDivider, AuthShell } from '@/components/auth/auth-shell';
import { AuthGuestOnly } from '@/components/auth/auth-guest-only';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { PhoneSignIn } from '@/components/auth/phone-sign-in';
import { PasswordField } from '@/components/auth/password-field';
import toast from 'react-hot-toast';
import { Loader2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmailStep = 'identify' | 'password';

export default function SignIn() {
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailStep, setEmailStep] = useState('identify' as EmailStep);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const { signInOrCreate, signInWithGoogle, refreshProfile } = useAuth();
  const router = useRouter();

  const isBusy = loading || googleLoading || phoneBusy;
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const goAfterAuth = async () => {
    await refreshProfile();
    const { getUserProfile } = await import('@/lib/supabase/users');
    const { getFirebaseAuth } = await import('@/lib/firebase/auth');
    const uid = getFirebaseAuth()?.currentUser?.uid;
    const nextProfile = uid ? await getUserProfile(uid) : null;
    router.push(getPostAuthPath(nextProfile));
  };

  const handlePhoneSuccess = async ({ created }: { created: boolean }) => {
    toast.success(created ? 'Account created' : 'Welcome back');
    await goAfterAuth();
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
    setEmailStep('password');
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
    <AuthShell
      heading="Welcome back"
      subheading="Sign in with your phone to continue shopping, bookings, and your account."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          New to ShiQueen?{' '}
          <Link href="/sign-up" className="font-semibold text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <AuthGuestOnly>
        <div className="space-y-5">
          <PhoneSignIn
            disabled={loading || googleLoading}
            onBusyChange={setPhoneBusy}
            onSuccess={handlePhoneSuccess}
          />

          <AuthDivider />

          <GoogleSignInButton
            loading={googleLoading}
            disabled={isBusy}
            onClick={handleGoogleSignIn}
            label="Continue with Google"
          />

          {emailOpen ? (
            emailStep === 'identify' ? (
              <form onSubmit={handleIdentify} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="rounded-xl border border-border/70 bg-muted/25 px-3.5 py-3">
                  <p className="text-xs text-muted-foreground">Signing in as</p>
                  <div className="mt-0.5 flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-foreground">{email}</p>
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
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <PasswordField
                    id="password"
                    value={password}
                    onChange={setPassword}
                    disabled={isBusy}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    New here? We’ll create an account with this email and password.{' '}
                    <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
                      Forgot password?
                    </Link>
                  </p>
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
                'hover:border-border hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                'disabled:pointer-events-none disabled:opacity-50'
              )}
            >
              <Mail className="h-[18px] w-[18px] shrink-0" />
              Continue with email
            </button>
          )}
        </div>
      </AuthGuestOnly>
    </AuthShell>
  );
}
