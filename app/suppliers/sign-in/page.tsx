'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { PasswordField } from '@/components/auth/password-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { isSupplierProfile } from '@/lib/auth-redirect';

function SupplierSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    signInOrCreate,
    signInWithGoogle,
    refreshProfile,
    user,
    loading: authLoading,
    isSupplier,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const nextPath = () => {
    const next = searchParams.get('next') || '/suppliers/orders';
    return next.startsWith('/suppliers') || next.startsWith('/supplier')
      ? next.replace(/^\/supplier(\/|$)/, '/suppliers$1')
      : '/suppliers/orders';
  };

  useEffect(() => {
    if (authLoading) return;
    if (user && isSupplier) {
      router.replace(nextPath());
    }
  }, [authLoading, user, isSupplier, router]);

  const finish = async () => {
    await refreshProfile();
    const { getUserProfile } = await import('@/lib/firebase/users');
    const { getFirebaseAuth } = await import('@/lib/firebase');
    const uid = getFirebaseAuth()?.currentUser?.uid;
    const nextProfile = uid ? await getUserProfile(uid) : null;
    if (!isSupplierProfile(nextProfile)) {
      toast.error('This account is not registered as a supplier.');
      router.push('/suppliers/sign-up');
      return;
    }
    router.push(nextPath());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { created } = await signInOrCreate(email.trim(), password);
      toast.success(created ? 'Account created — complete your supplier application' : 'Welcome back');
      await finish();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      await finish();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const busy = loading || googleLoading;

  return (
    <AuthShell heading="Supplier sign in" subheading="Access your supplier dashboard">
      <div className="space-y-5">
        <GoogleSignInButton
          loading={googleLoading}
          disabled={busy}
          onClick={handleGoogle}
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordField
              id="password"
              value={password}
              onChange={setPassword}
              disabled={busy}
            />
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New supplier?{' '}
        <Link href="/suppliers/sign-up" className="font-medium text-primary hover:underline">
          Apply here
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SupplierSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SupplierSignInForm />
    </Suspense>
  );
}
