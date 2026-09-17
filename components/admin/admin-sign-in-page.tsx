'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Mail } from 'lucide-react';
import { AuthDivider, AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { PasswordField } from '@/components/auth/password-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { ADMIN_HOME_HREF } from '@/lib/pwa/paths';
import { cn } from '@/lib/utils';

export function AdminSignInPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, refreshProfile, logout, user, isAdmin, loading: authLoading } =
    useAuth();
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const busy = loading || googleLoading || authLoading;
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const goIfAdmin = async () => {
    await refreshProfile();
    const { getUserProfile } = await import('@/lib/supabase/users');
    const { getFirebaseAuth } = await import('@/lib/firebase/auth');
    const uid = getFirebaseAuth()?.currentUser?.uid;
    const nextProfile = uid ? await getUserProfile(uid) : null;
    if (nextProfile?.role !== 'admin') {
      toast.error('This app is for ShiQueen admins.');
      await logout();
      return;
    }
    router.replace(ADMIN_HOME_HREF);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      await goIfAdmin();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailIsValid) {
      toast.error('Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      await goIfAdmin();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && user && isAdmin) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!authLoading && user && !isAdmin) {
    return (
      <AuthShell
        eyebrow="Admin"
        heading="Admin access only"
        subheading="This account isn’t an admin. Sign out and use an admin account."
      >
        <Button
          type="button"
          className="h-11 w-full rounded-xl"
          onClick={() => void logout()}
        >
          Sign out
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Admin"
      heading="Admin sign in"
      subheading="Sign in to manage the ShiQueen store, orders, and partners."
    >
      <div className="space-y-5">
        <GoogleSignInButton
          loading={googleLoading}
          disabled={busy}
          onClick={() => void handleGoogle()}
          label="Continue with Google"
        />

        <AuthDivider />

        {emailOpen ? (
          <form onSubmit={(e) => void handleEmail(e)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl text-base md:text-sm"
                required
                disabled={busy}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <PasswordField
                id="admin-password"
                value={password}
                onChange={setPassword}
                disabled={busy}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="h-11 w-full rounded-xl text-sm font-semibold"
              disabled={busy || !emailIsValid || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sign in
                </>
              ) : (
                'Sign in with email'
              )}
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEmailOpen(true)}
            disabled={busy}
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
    </AuthShell>
  );
}
