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
import { PasswordField } from '@/components/auth/password-field';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp, signInWithGoogle, refreshProfile } = useAuth();
  const router = useRouter();

  const goAfterAuth = async () => {
    await refreshProfile();
    const { getUserProfile } = await import('@/lib/supabase/users');
    const { getFirebaseAuth } = await import('@/lib/firebase/auth');
    const uid = getFirebaseAuth()?.currentUser?.uid;
    const nextProfile = uid ? await getUserProfile(uid) : null;
    router.push(getPostAuthPath(nextProfile));
  };

  const isBusy = loading || googleLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email.trim(), password);
      toast.success('Account created — check your email to verify');
      await goAfterAuth();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
      console.error(error);
    } finally {
      setLoading(false);
    }
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

  return (
    <AuthShell
      heading="Create your account"
      subheading="Shop fashion, packages, and book trusted services — all in one place."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <AuthGuestOnly>
        <div className="space-y-5">
          <GoogleSignInButton
            loading={googleLoading}
            disabled={isBusy}
            onClick={handleGoogleSignIn}
            label="Continue with Google"
          />

          <AuthDivider />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl text-base md:text-sm"
                required
                disabled={isBusy}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <PasswordField
                id="password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                disabled={isBusy}
              />
              <p className="text-xs text-muted-foreground">At least 6 characters</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm password
              </Label>
              <PasswordField
                id="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm password"
                autoComplete="new-password"
                disabled={isBusy}
              />
            </div>

            <Button
              type="submit"
              className="mt-1 h-11 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/15"
              disabled={isBusy}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </Button>

            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              By continuing you agree to our{' '}
              <Link href="/terms" className="underline-offset-2 hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </div>
      </AuthGuestOnly>
    </AuthShell>
  );
}
