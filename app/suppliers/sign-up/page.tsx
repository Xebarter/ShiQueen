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
      heading="Supplier sign up"
      subheading="Apply to list products and packages on ShiQueen"
    >
      <div className="space-y-5">
        {!user && (
          <>
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
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => setField('companyName', e.target.value)}
              required
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact name</Label>
            <Input
              id="contactName"
              value={form.contactName}
              onChange={(e) => setField('contactName', e.target.value)}
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
              autoComplete="email"
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
            <Label>What will you list?</Label>
            <div className="grid grid-cols-2 gap-2">
              {SIGNUP_CATEGORIES.map((cat) => {
                const active = form.categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={busy}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition',
                      active
                        ? 'border-primary/40 bg-primary/5 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-border/80'
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

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
        Already a supplier?{' '}
        <Link href="/suppliers/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        <Link href="/suppliers" className="hover:text-foreground">
          ← Back to supplier info
        </Link>
      </p>
    </AuthShell>
  );
}
