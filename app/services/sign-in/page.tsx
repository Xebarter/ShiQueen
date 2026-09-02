'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthDivider, AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { PhoneSignIn } from '@/components/auth/phone-sign-in';
import { PasswordField } from '@/components/auth/password-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useFeatureFlags } from '@/lib/feature-flags-context';
import { canShowProviderApplications } from '@/lib/feature-flags';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { isServiceProviderProfile } from '@/lib/auth-redirect';

function ProviderSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInOrCreate, signInWithGoogle, refreshProfile, user, isServiceProvider, loading: authLoading } =
    useAuth();
  const { flags } = useFeatureFlags();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);

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
    const { getUserProfile } = await import('@/lib/supabase/users');
    const { getFirebaseAuth } = await import('@/lib/firebase/auth');
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

  const busy = loading || googleLoading || phoneBusy;

  return (
    <AuthShell
      eyebrow="Services partner"
      heading="Welcome back"
      subheading="Sign in with your phone to manage bookings, listings, and your services dashboard."
      footer={
        canShowProviderApplications(flags) ? (
        <p className="text-center text-sm text-muted-foreground">
          New provider?{' '}
          <Link
            href="/services/sign-up"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Apply here
          </Link>
        </p>
        ) : undefined
      }
    >
      <div className="space-y-5">
        <PhoneSignIn
          disabled={loading || googleLoading}
          onBusyChange={setPhoneBusy}
          onSuccess={async ({ created }) => {
            toast.success(created ? 'Account created — complete your provider application' : 'Welcome back');
            await finish();
          }}
        />
        <AuthDivider />
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
              required
              disabled={busy}
              autoComplete="email"
              placeholder="you@studio.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <PasswordField id="password" value={password} onChange={setPassword} disabled={busy} />
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-xl text-sm font-semibold"
            variant="outline"
            disabled={busy}
          >
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
