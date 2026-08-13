'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { PasswordField } from '@/components/auth/password-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getFirebaseAuth } from '@/lib/firebase';
import { linkProviderRegistration } from '@/lib/firebase/service-providers';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { SERVICE_CATALOG } from '@/lib/service-catalog';
import { cn } from '@/lib/utils';

export default function ProviderSignUpPage() {
  const router = useRouter();
  const { refreshProfile, signInWithGoogle, signUp, user, isServiceProvider, loading: authLoading } =
    useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    city: 'Kampala',
    bio: '',
    password: '',
    confirmPassword: '',
    categoryIds: [] as string[],
    mobileServiceEnabled: true,
  });

  useEffect(() => {
    if (!authLoading && isServiceProvider) {
      router.replace('/services/dashboard/bookings');
    }
  }, [authLoading, isServiceProvider, router]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      email: user.email ?? prev.email,
      name: user.displayName ?? prev.name,
    }));
  }, [user]);

  const setField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const submitApplication = async (uid: string, email: string) => {
    await linkProviderRegistration(uid, {
      name: form.name,
      businessName: form.businessName,
      email,
      phone: form.phone,
      city: form.city,
      bio: form.bio,
      categoryIds: form.categoryIds,
      mobileServiceEnabled: form.mobileServiceEnabled,
    });
    await refreshProfile();
    toast.success('Application submitted — awaiting approval');
    router.push('/services/dashboard/bookings?welcome=1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.businessName.trim()) {
      toast.error('Name and business name are required');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (form.categoryIds.length === 0) {
      toast.error('Select at least one service category');
      return;
    }

    setLoading(true);
    try {
      let uid = user?.uid;
      let email = (user?.email || form.email).trim().toLowerCase();

      if (!uid) {
        if (form.password !== form.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        if (form.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await signUp(email, form.password);
        uid = getFirebaseAuth()?.currentUser?.uid;
        email = getFirebaseAuth()?.currentUser?.email?.toLowerCase() || email;
      }

      if (!uid) throw new Error('Could not create account');
      await submitApplication(uid, email);
    } catch (error) {
      console.error(error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || googleLoading;

  return (
    <AuthShell
      heading="Provider sign up"
      subheading="Apply to list beauty and wellness services on SheQueen"
    >
      <div className="space-y-5">
        {!user && (
          <>
            <GoogleSignInButton
              loading={googleLoading}
              disabled={busy}
              label="Continue with Google"
              onClick={async () => {
                setGoogleLoading(true);
                try {
                  await signInWithGoogle();
                  toast.success('Signed in with Google — complete your application');
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
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              value={form.businessName}
              onChange={(e) => setField('businessName', e.target.value)}
              required
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              required
              disabled={busy || Boolean(user)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                required
                disabled={busy}
                placeholder="+256…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                required
                disabled={busy}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Short bio</Label>
            <textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setField('bio', e.target.value)}
              disabled={busy}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Service categories</Label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_CATALOG.map((cat) => {
                const active = form.categoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={busy}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-left text-xs font-medium transition',
                      active
                        ? 'border-primary/40 bg-primary/5 text-primary'
                        : 'border-border bg-background text-muted-foreground'
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.mobileServiceEnabled}
              onChange={(e) => setField('mobileServiceEnabled', e.target.checked)}
              disabled={busy}
            />
            I offer mobile / home visits
          </label>

          {!user && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordField
                  id="password"
                  value={form.password}
                  onChange={(v) => setField('password', v)}
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <PasswordField
                  id="confirmPassword"
                  value={form.confirmPassword}
                  onChange={(v) => setField('confirmPassword', v)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit application'
            )}
          </Button>
        </form>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already a provider?{' '}
        <Link href="/services/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
