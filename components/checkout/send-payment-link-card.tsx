'use client';

import { useState } from 'react';
import { Gift, Link2, Loader2, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CartItem } from '@/lib/cart-context';
import type { OrderItem } from '@/lib/types/database';
import { shareOrCopy } from '@/lib/share';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

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
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const canCreate = isDeliveryComplete(deliveryDetails) && cartItems.length > 0;

  const handleCreateLink = async () => {
    if (!canCreate) {
      toast.error('Please complete your delivery details first.');
      return;
    }

    setLoading(true);
    try {
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
          senderUserId,
          senderMessage: message,
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

      setShareUrl(data.shareUrl as string);
      setExpiresAt(data.expiresAt as string);
      toast.success('Payment link created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create payment link.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = async () => {
    if (!shareUrl) return;

    const result = await shareOrCopy({
      title: `Pay for my SheQueen order (${formatUGX(total)})`,
      text: message.trim() || 'Could you pay for my SheQueen order? Delivery details are already included.',
      url: shareUrl,
    });

    if (result === 'copied') {
      toast.success('Payment link copied to clipboard');
    }
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm shadow-primary/5',
        className
      )}
    >
      <div className="border-b border-border/50 bg-gradient-to-r from-accent/10 to-transparent px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Gift className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-medium tracking-tight">Someone else paying?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Send a link so a friend or family member can pay for this order. Delivery stays on
              your details above.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="gift-message" className="text-sm font-medium">
            Optional message
          </Label>
          <Input
            id="gift-message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            placeholder="e.g. Could you cover this for my birthday? 🎁"
            className="h-11 rounded-xl"
            maxLength={200}
          />
        </div>

        {!shareUrl ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-2 rounded-xl"
            disabled={!canCreate || loading}
            onClick={handleCreateLink}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            Create payment link
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">Payment link ready</p>
            <p className="break-all text-xs text-muted-foreground">{shareUrl}</p>
            {expiresAt && (
              <p className="text-xs text-muted-foreground">
                Valid until {new Date(expiresAt).toLocaleString()}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" className="gap-2 rounded-xl" onClick={handleShareLink}>
                <Share2 className="h-4 w-4" />
                Share link
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setShareUrl(null);
                  setExpiresAt(null);
                }}
              >
                Create new link
              </Button>
            </div>
          </div>
        )}

        {!canCreate && (
          <p className="text-xs text-muted-foreground">
            Fill in your name, phone, email, and delivery address to create a payment link.
          </p>
        )}
      </div>
    </div>
  );
}
