'use client';

import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified) return null;
  const isPassword = user.providerData.some((p) => p.providerId === 'password');
  if (!isPassword) return null;

  return (
    <div className="border-b border-sky-200/70 bg-sky-50 px-4 py-2.5 text-sm text-sky-900 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Verify {user.email} to keep your account secure.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={sending}
          onClick={async () => {
            setSending(true);
            try {
              await resendVerificationEmail();
              toast.success('Verification email sent');
            } catch (error) {
              toast.error(getAuthErrorMessage(error));
            } finally {
              setSending(false);
            }
          }}
        >
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Resend email'}
        </Button>
      </div>
    </div>
  );
}
