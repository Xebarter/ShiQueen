'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { GiftPayLinkPanel } from '@/components/payments/gift-pay-link-panel';
import {
  ContinueAuthDialog,
  useContinueAuthPrompt,
} from '@/components/auth/continue-auth-dialog';
import type { CartItem } from '@/lib/cart-context';
import type { OrderItem } from '@/lib/types/database';
import { shareOrCopy } from '@/lib/share';
import { formatUGX } from '@/lib/wholesale-data';

interface SendPaymentLinkCardProps {
  cartItems: CartItem[];
  orderItems: OrderItem[];
  subtotal: number;
  total: number;
  orderType: 'retail' | 'wholesale' | 'package';
  deliveryDetails: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  senderUserId?: string | null;
  className?: string;
}

function isDeliveryComplete(details: SendPaymentLinkCardProps['deliveryDetails']): boolean {
  return (
    details.fullName.trim().length > 0 &&
    details.email.trim().length > 0 &&
    details.phone.trim().length > 0 &&
    details.address.trim().length > 0
  );
}

export function SendPaymentLinkCard({
  cartItems,
  orderItems,
  subtotal,
  total,
  orderType,
  deliveryDetails,
  senderUserId,
  className,
}: SendPaymentLinkCardProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const {
    user,
    authLoading,
    authPromptOpen,
    setAuthPromptOpen,
    authIntent,
    requireAuth,
  } = useContinueAuthPrompt();

  const canShare = isDeliveryComplete(deliveryDetails) && cartItems.length > 0;

  const createLink = async (): Promise<string> => {
    const response = await fetch('/api/checkout/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartItems,
        orderItems,
        subtotal,
        total,
        orderType,
        fullName: deliveryDetails.fullName,
        email: deliveryDetails.email,
        phone: deliveryDetails.phone,
        address: deliveryDetails.address,
        city: deliveryDetails.city,
        senderUserId: senderUserId || user?.uid || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to create payment link.');
    }

    if (data.requiresClientStorage) {
      const { createSharedCheckout } = await import('@/lib/firebase/shared-checkouts');
      await createSharedCheckout({
        id: data.token as string,
        cartItems: data.checkout.cartItems,
        orderItems: data.checkout.orderItems,
        subtotal: data.checkout.subtotal,
        total: data.checkout.total,
        orderType: data.checkout.orderType,
        recipientName: data.checkout.recipientName,
        shippingAddress: data.checkout.shippingAddress,
        senderUserId: data.checkout.senderUserId ?? null,
        senderMessage: data.checkout.senderMessage,
        expiresAt: new Date(data.checkout.expiresAt as string),
      });
    }

    const url = data.shareUrl as string;
    setShareUrl(url);
    setExpiresAt(data.expiresAt as string);
    return url;
  };

  const handleShareLink = async () => {
    if (!canShare) {
      toast.error('Please complete your delivery details first.');
      return;
    }
    if (!requireAuth('payment-link')) return;

    setLoading(true);
    try {
      const url = shareUrl ?? (await createLink());
      const result = await shareOrCopy({
        title: `Pay for my ShiQueen order (${formatUGX(total)})`,
        text: 'Could you pay for my ShiQueen order? Delivery details are already included.',
        url,
      });

      if (result === 'copied') {
        toast.success('Payment link copied to clipboard');
      } else if (result === 'shared') {
        toast.success('Payment link shared');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to share payment link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!requireAuth('payment-link')) return;
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Payment link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <>
    <GiftPayLinkPanel
      className={className}
      amountLabel="Order total"
      total={total}
      recipientName={deliveryDetails.fullName.trim() || 'you'}
      shareUrl={shareUrl}
      expiresAt={expiresAt}
      loading={loading || authLoading}
      canShare={canShare}
      onShareLink={handleShareLink}
      onCopyLink={handleCopyLink}
      shareLabel="Share payment link"
      helperText={
        !isDeliveryComplete(deliveryDetails)
          ? user
            ? 'Fill in your name, phone, email, and delivery address above first.'
            : 'Fill in delivery details, then sign in to create the payment link.'
          : user
            ? undefined
            : 'Sign in to create and copy the payment link.'
      }
    />
    <ContinueAuthDialog
      open={authPromptOpen}
      onClose={() => setAuthPromptOpen(false)}
      intent={authIntent}
      nextPath="/checkout"
    />
    </>
  );
}
