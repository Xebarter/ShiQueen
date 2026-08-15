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
import { linkSupplierRegistration } from '@/lib/firebase/suppliers';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import {
  SUPPLIER_CATEGORY_OPTIONS,
  type SupplierCategory,
} from '@/lib/types/suppliers';
import { cn } from '@/lib/utils';

const SIGNUP_CATEGORIES = SUPPLIER_CATEGORY_OPTIONS.filter(
  (c) => c.id === 'products' || c.id === 'packages'
);

const fieldClass = 'h-11 rounded-xl text-base md:text-sm';

export default function SupplierSignUpPage() {
  const router = useRouter();
  const {
    refreshProfile,
    signInWithGoogle,
    signUp,
    user,
    isSupplier,
    loading: authLoading,
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: 'Kampala',
    password: '',
    confirmPassword: '',
    categories: ['products', 'packages'] as SupplierCategory[],
  });

  useEffect(() => {
    if (!authLoading && isSupplier) {
      router.replace('/suppliers/orders');
    }
  }, [authLoading, isSupplier, router]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      email: user.email ?? prev.email,
      contactName: user.displayName ?? prev.contactName,
    }));
  }, [user]);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (id: SupplierCategory) => {
    setForm((prev) => {
      const has = prev.categories.includes(id);
      return {
        ...prev,
        categories: has
          ? prev.categories.filter((c) => c !== id)
          : [...prev.categories, id],
      };
    });
  };

  const submitApplication = async (uid: string, email: string) => {
    await linkSupplierRegistration(uid, {
      companyName: form.companyName,
      contactName: form.contactName,
      email,
      phone: form.phone,
      city: form.city,
      categories: form.categories,
    });
    await refreshProfile();
    toast.success('Application submitted — awaiting approval');
    router.push('/suppliers/orders?welcome=1');
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google — complete your application');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.contactName.trim()) {
      toast.error('Company and contact name are required');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (form.categories.length === 0) {
      toast.error('Select at least one category');
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
      eyebrow="Supplier partner"
      heading="Join the atelier"
      subheading="Apply to list products and curated packages on ShiQueen. Approval usually takes 1–2 business days."
      footer={
        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Already a supplier?{' '}
            <Link
              href="/suppliers/sign-in"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p>
            <Link href="/suppliers" className="transition hover:text-foreground">
              ← Back to supplier info
            </Link>
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {!user && (
          <div className="space-y-4">
            <GoogleSignInButton
              loading={googleLoading}
              disabled={busy}
              onClick={handleGoogle}
              label="Continue with Google"
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
            <AuthSectionLabel>Business</AuthSectionLabel>
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-sm font-medium">
                Company name
              </Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => setField('companyName', e.target.value)}
                className={fieldClass}
                placeholder="Your brand or company"
                required
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactName" className="text-sm font-medium">
                Contact name
              </Label>
              <Input
                id="contactName"
                value={form.contactName}
                onChange={(e) => setField('contactName', e.target.value)}
                className={fieldClass}
                placeholder="Primary contact"
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
                placeholder="you@business.com"
                required
                disabled={busy || Boolean(user)}
                autoComplete="email"
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
          </div>

          <div className="space-y-3">
            <AuthSectionLabel>What will you list?</AuthSectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {SIGNUP_CATEGORIES.map((cat) => {
                const active = form.categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={busy}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      'relative rounded-xl border px-3.5 py-3.5 text-left text-sm font-semibold transition',
                      active
                        ? 'border-primary/35 bg-primary/[0.06] text-primary shadow-sm'
                        : 'border-border/80 bg-background text-muted-foreground hover:border-border hover:text-foreground'
                    )}
                  >
                    {active ? (
                      <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    ) : null}
                    {cat.label}
                  </button>
                );
              })}
            </div>
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
