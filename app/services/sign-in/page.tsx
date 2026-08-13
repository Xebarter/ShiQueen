'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { isServiceProviderProfile } from '@/lib/auth-redirect';

function ProviderSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInOrCreate, signInWithGoogle, refreshProfile, user, isServiceProvider, loading: authLoading } =
    useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const nextPath = () => {
    const next = searchParams.get('next') || '/services/dashboard/bookings';
    return next.startsWith('/services/dashboard') || next.startsWith('/services/sign')
      ? next
      : '/services/dashboard/bookings';
  };

  useEffect(() => {
    if (authLoading) return;
    if (user && isServiceProvider) router.replace(nextPath());
  }, [authLoading, user, isServiceProvider, router]);

  const finish = async () => {
    await refreshProfile();
    const { getUserProfile } = await import('@/lib/firebase/users');
    const { getFirebaseAuth } = await import('@/lib/firebase');
    const uid = getFirebaseAuth()?.currentUser?.uid;
    const nextProfile = uid ? await getUserProfile(uid) : null;
    if (!isServiceProviderProfile(nextProfile)) {
      toast.error('This account is not registered as a service provider.');
      router.push('/services/sign-up');
      return;
    }
    router.push(nextPath());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { created } = await signInOrCreate(email.trim(), password);
      toast.success(created ? 'Account created — complete your provider application' : 'Welcome back');
      await finish();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || googleLoading;

  return (
    <AuthShell heading="Provider sign in" subheading="Access your services dashboard">
      <div className="space-y-5">
        <GoogleSignInButton
          loading={googleLoading}
          disabled={busy}
          label="Continue with Google"
          onClick={async () => {
            setGoogleLoading(true);
            try {
              await signInWithGoogle();
              await finish();
            } catch (error) {
              toast.error(getAuthErrorMessage(error));
            } finally {
              setGoogleLoading(false);
            }
          }}
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
            <PasswordField id="password" value={password} onChange={setPassword} disabled={busy} />
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
        New provider?{' '}
        <Link href="/services/sign-up" className="font-medium text-primary hover:underline">
          Apply here
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ProviderSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProviderSignInForm />
    </Suspense>
  );
}
