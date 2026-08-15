'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailIsValid) {
      toast.error('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      heading="Reset password"
      subheading="We’ll email you a secure link to choose a new password."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="font-semibold text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-3 text-sm leading-relaxed">
          <p className="text-muted-foreground">
            If an account exists for{' '}
            <span className="font-semibold text-foreground">{email}</span>, you’ll receive a
            reset link shortly. Check spam if you don’t see it.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
              placeholder="you@email.com"
              required
              disabled={loading}
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/15"
            disabled={loading || !emailIsValid}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
