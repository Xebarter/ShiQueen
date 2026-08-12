'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthGuestOnly } from '@/components/auth/auth-guest-only';
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
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
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
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.categories.length === 0) {
      toast.error('Select at least one category');
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      toast.error('Authentication is not configured');
      return;
    }

    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        form.password
      );
      await linkSupplierRegistration(credential.user.uid, {
        companyName: form.companyName,
        contactName: form.contactName,
        email,
        phone: form.phone,
        city: form.city,
        categories: form.categories,
      });
      await refreshProfile();
      toast.success('Application submitted — awaiting approval');
      router.push('/supplier/dashboard');
    } catch (error) {
      console.error(error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuestOnly>
      <AuthShell
        heading="Supplier sign up"
        subheading="Apply to list products and packages on SheQueen"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => setField('companyName', e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact name</Label>
            <Input
              id="contactName"
              value={form.contactName}
              onChange={(e) => setField('contactName', e.target.value)}
              required
              disabled={loading}
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
              disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                    disabled={loading}
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

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              'Submit application'
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already a supplier?{' '}
          <Link href="/supplier/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          <Link href="/supplier" className="hover:text-foreground">
            ← Back to supplier info
          </Link>
        </p>
      </AuthShell>
    </AuthGuestOnly>
  );
}
