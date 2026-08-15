'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthDivider, AuthSectionLabel, AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { PasswordField } from '@/components/auth/password-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { linkProviderRegistration } from '@/lib/firebase/service-providers';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { SERVICE_CATALOG } from '@/lib/service-catalog';
import { cn } from '@/lib/utils';

const fieldClass = 'h-11 rounded-xl text-base md:text-sm';

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
      size="wide"
      eyebrow="Services partner"
      heading="Offer your craft"
      subheading="Apply to list beauty and wellness services on ShiQueen. We’ll review your studio before you go live."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already a provider?{' '}
          <Link
            href="/services/sign-in"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        {!user && (
          <div className="space-y-4">
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
            <AuthDivider />
          </div>
        )}

        {user ? (
          <div className="rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{user.email}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <AuthSectionLabel>Profile</AuthSectionLabel>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Your name
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className={fieldClass}
                placeholder="Full name"
                required
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="businessName" className="text-sm font-medium">
                Business name
              </Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) => setField('businessName', e.target.value)}
                className={fieldClass}
                placeholder="Studio or brand name"
                required
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-4">
            <AuthSectionLabel>Contact</AuthSectionLabel>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className={fieldClass}
                placeholder="you@studio.com"
                required
                disabled={busy || Boolean(user)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  className={fieldClass}
                  required
                  disabled={busy}
                  placeholder="+256…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-sm font-medium">
                  City
                </Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  className={fieldClass}
                  required
                  disabled={busy}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-sm font-medium">
                Short bio
              </Label>
              <textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setField('bio', e.target.value)}
                disabled={busy}
                rows={3}
                placeholder="Tell clients what makes your work special…"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <AuthSectionLabel>Service categories</AuthSectionLabel>
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
                      'relative rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition sm:text-sm',
                      active
                        ? 'border-primary/35 bg-primary/[0.06] text-primary shadow-sm'
                        : 'border-border/80 bg-background text-muted-foreground hover:border-border hover:text-foreground'
                    )}
                  >
                    {active ? (
                      <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    ) : null}
                    <span className="pr-5">{cat.name}</span>
                  </button>
                );
              })}
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3 text-sm transition hover:bg-muted/35">
              <input
                type="checkbox"
                checked={form.mobileServiceEnabled}
                onChange={(e) => setField('mobileServiceEnabled', e.target.checked)}
                disabled={busy}
                className="size-4 rounded border-border text-primary accent-primary"
              />
              <span className="font-medium text-foreground">I offer mobile / home visits</span>
            </label>
          </div>

          {!user && (
            <div className="space-y-4">
              <AuthSectionLabel>Account security</AuthSectionLabel>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <PasswordField
                  id="password"
                  value={form.password}
                  onChange={(v) => setField('password', v)}
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm password
                </Label>
                <PasswordField
                  id="confirmPassword"
                  value={form.confirmPassword}
                  onChange={(v) => setField('confirmPassword', v)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/15"
            disabled={busy}
          >
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
    </AuthShell>
  );
}
