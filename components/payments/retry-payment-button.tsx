'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RetryPaymentButton({
  orderId,
  gift = false,
  label = 'Pay',
  className,
  size = 'lg',
}: {
  orderId: string;
  gift?: boolean;
  label?: string;
  className?: string;
  size?: 'sm' | 'lg';
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handlePay = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/payments/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = (await response.json()) as {
        error?: string;
        alreadyPaid?: boolean;
        checkoutUrl?: string;
        returnUrl?: string;
        orderId?: string;
        stk?: { status?: string; details?: { message?: string } };
      };

      if (data.alreadyPaid) {
        toast.success('Paid');
        router.push(
          `/order-confirmation?orderId=${encodeURIComponent(orderId)}${gift ? '&gift=1' : ''}`
        );
        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? 'Could not start payment.');
      }

      if (data.stk?.status === 'pending') {
        toast.success(data.stk.details?.message ?? 'Approve on your phone.');
        router.push(
          data.returnUrl ??
            `/order-confirmation?orderId=${encodeURIComponent(orderId)}${gift ? '&gift=1' : ''}&payment=pending`
        );
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.returnUrl) {
        router.push(data.returnUrl);
        return;
      }

      throw new Error('Could not start payment.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start payment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      size={size === 'lg' ? 'lg' : 'sm'}
      className={cn(size === 'lg' ? 'h-12 min-w-[9rem] rounded-xl' : 'h-8 rounded-lg', className)}
      disabled={busy}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void handlePay();
      }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </Button>
  );
}
