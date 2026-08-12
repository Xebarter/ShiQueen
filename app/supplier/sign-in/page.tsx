'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthGuestOnly } from '@/components/auth/auth-guest-only';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { getUserProfile } from '@/lib/firebase/users';

function SupplierSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      await refreshProfile();
      const auth = (await import('@/lib/firebase')).getFirebaseAuth();
      const uid = auth?.currentUser?.uid;
      if (uid) {
        const profile = await getUserProfile(uid);
        if (profile?.role !== 'supplier') {
          toast.error('This account is not registered as a supplier.');
          router.push('/supplier/sign-up');
          return;
        }
      }
      const next = searchParams.get('next') || '/supplier/dashboard';
      router.push(next.startsWith('/supplier') ? next : '/supplier/dashboard');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell heading="Supplier sign in" subheading="Access your supplier dashboard">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
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
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New supplier?{' '}
        <Link href="/supplier/sign-up" className="font-medium text-primary hover:underline">
          Apply here
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SupplierSignInPage() {
  return (
    <AuthGuestOnly>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <SupplierSignInForm />
      </Suspense>
    </AuthGuestOnly>
  );
}
