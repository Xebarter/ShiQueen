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
    <AuthShell heading="Create your account" subheading="to get started with ShiQueen">
      <AuthGuestOnly>
      <div className="space-y-5">
        <GoogleSignInButton
          loading={googleLoading}
          disabled={isBusy}
          onClick={handleGoogleSignIn}
          label="Sign up with Google"
        />

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-xs text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-normal text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-md text-base md:text-sm"
              required
              disabled={isBusy}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-normal text-foreground">
              Password
            </Label>
            <PasswordField
              id="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              disabled={isBusy}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-normal text-foreground">
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

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-3 sm:flex-row sm:items-center">
            <Link href="/sign-in" className="text-sm font-medium text-primary hover:underline">
              Sign in instead
            </Link>
            <Button type="submit" className="h-10 min-w-[88px] px-6" disabled={isBusy}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </div>
        </form>
      </div>
      </AuthGuestOnly>
    </AuthShell>
  );
}
