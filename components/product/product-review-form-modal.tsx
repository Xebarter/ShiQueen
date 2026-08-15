'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { Loader2, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import {
  generateProductReviewId,
  getUserProductReview,
  upsertProductReview,
  userDeliveredProduct,
} from '@/lib/firebase/product-reviews';
import { getDisplayName } from '@/lib/user-display';
import { cn } from '@/lib/utils';

export type ProductReviewFormProps = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  orderId?: string;
  onSubmitted?: () => void;
};

function StarPicker({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md';
}) {
  const [hover, setHover] = useState(0);
  const iconClass = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            className="rounded-md p-0.5 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Star
              className={cn(
                iconClass,
                active ? 'fill-accent text-accent' : 'text-muted-foreground/40'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ProductReviewFormModal({
  open,
  onClose,
  productId,
  productName,
  orderId,
  onSubmitted,
}: ProductReviewFormProps) {
  const titleId = useId();
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [existingId, setExistingId] = useState<string | null>(null);
  const [verified, setVerified] = useState(Boolean(orderId));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [existing, delivered] = await Promise.all([
          getUserProductReview(productId, user!.uid),
          orderId ? Promise.resolve(true) : userDeliveredProduct(productId),
        ]);
        if (cancelled) return;
        if (existing) {
          setExistingId(existing.id);
          setRating(existing.rating);
          setTitle(existing.title);
          setComment(existing.comment);
          setVerified(existing.isVerified || delivered);
        } else {
          setExistingId(null);
          setRating(5);
          setTitle('');
          setComment('');
          setVerified(delivered);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) toast.error('Could not load your review');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, user, productId, orderId]);

  if (!open) return null;

  const displayName = getDisplayName(profile?.displayName, user?.email);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast.error('Sign in to leave a review');
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error('Choose a rating from 1 to 5 stars');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a short review');
      return;
    }

    setSaving(true);
    try {
      await upsertProductReview({
        id: existingId ?? generateProductReviewId(),
        productId,
        orderId,
        userId: user.uid,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        customerName: displayName,
        isVerified: verified || Boolean(orderId),
        isVisible: true,
      });
      toast.success(existingId ? 'Review updated' : 'Thanks for your review');
      onSubmitted?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Could not save review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close review form"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {existingId ? 'Update your review' : 'Write a review'}
            </h2>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!user ? (
          <div className="space-y-4 px-4 py-8 text-center sm:px-5">
            <p className="text-sm text-muted-foreground">
              Sign in to rate this product and share your experience.
            </p>
            <Link href={`/sign-in?next=${encodeURIComponent(`/products/${productId}`)}`}>
              <Button type="button">Sign in</Button>
            </Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div>
                <Label className="mb-2 block">Your rating</Label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div>
                <Label htmlFor="review-title">Title (optional)</Label>
                <Input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What stood out?"
                  className="mt-1.5"
                  maxLength={120}
                />
              </div>
              <div>
                <Label htmlFor="review-comment">Review</Label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  required
                  maxLength={2000}
                  placeholder="How was the quality, fit, and delivery?"
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {verified ? (
                <p className="text-xs text-emerald-700">Verified purchase — thank you for ordering.</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Tip: leave a review from a delivered order to mark it as a verified purchase.
                </p>
              )}
            </div>
            <div className="flex gap-2 border-t border-border/70 px-4 py-3 sm:px-5">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {existingId ? 'Save changes' : 'Submit review'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
