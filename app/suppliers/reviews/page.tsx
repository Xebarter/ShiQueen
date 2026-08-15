'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Flag,
  Loader2,
  Star,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SupplierShell } from '@/components/supplier/supplier-shell';
import {
  PartnerCard,
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
} from '@/components/partner/partner-page';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useProducts } from '@/lib/products-context';
import {
  flagProductReview,
  productReviewFlagLabel,
  subscribeProductReviews,
} from '@/lib/firebase/product-reviews';
import {
  PRODUCT_REVIEW_FLAG_REASONS,
  type ProductReview,
  type ProductReviewFlagReason,
} from '@/lib/types/database';
import { cn } from '@/lib/utils';

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i <= rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}

function FlagReviewModal({
  review,
  productName,
  onClose,
  onFlagged,
}: {
  review: ProductReview;
  productName: string;
  onClose: () => void;
  onFlagged: () => void;
}) {
  const [reason, setReason] = useState<ProductReviewFlagReason>('inappropriate');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await flagProductReview(review.id, reason, note);
      toast.success('Review flagged for admin review');
      onFlagged();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not flag review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">Flag review</h2>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-5">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{review.customerName || 'Customer'}</p>
              <Stars rating={review.rating} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-4">
              {review.comment}
            </p>
          </div>

          <div>
            <Label className="mb-2 block">Reason</Label>
            <div className="space-y-2">
              {PRODUCT_REVIEW_FLAG_REASONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition',
                    reason === option.value
                      ? 'border-primary/40 bg-primary/[0.04]'
                      : 'border-border/70 hover:border-border'
                  )}
                >
                  <input
                    type="radio"
                    name="flag-reason"
                    className="mt-1"
                    checked={reason === option.value}
                    onChange={() => setReason(option.value)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="flag-note">Note for admin (optional)</Label>
            <textarea
              id="flag-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Add context that helps moderation…"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-1.5" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
              Submit flag
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SupplierReviewsPage() {
  const { supplierId } = useAuth();
  const { products } = useProducts();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');
  const [flagTarget, setFlagTarget] = useState<ProductReview | null>(null);

  const myProductIds = useMemo(
    () => new Set(products.filter((p) => p.supplierId === supplierId).map((p) => p.id)),
    [products, supplierId]
  );

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      if (product.supplierId === supplierId) map.set(product.id, product.name);
    }
    return map;
  }, [products, supplierId]);

  useEffect(() => {
    const unsubscribe = subscribeProductReviews(
      (next) => {
        setReviews(next);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  const mine = useMemo(() => {
    const list = reviews.filter((review) => myProductIds.has(review.productId));
    if (filter === 'flagged') return list.filter((review) => review.flagStatus === 'pending');
    return list;
  }, [reviews, myProductIds, filter]);

  const pendingFlags = reviews.filter(
    (review) => myProductIds.has(review.productId) && review.flagStatus === 'pending'
  ).length;

  return (
    <SupplierShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Reputation"
          title="Reviews"
          description="Customer feedback on your products. Flag anything that needs ShiQueen moderation."
        />

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(
            [
              { id: 'all' as const, label: 'All reviews' },
              {
                id: 'flagged' as const,
                label: pendingFlags ? `Flagged (${pendingFlags})` : 'Flagged',
              },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition',
                filter === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-background text-muted-foreground'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : mine.length === 0 ? (
          <PartnerEmptyState
            icon={Star}
            title={filter === 'flagged' ? 'No flagged reviews' : 'No reviews yet'}
            description={
              filter === 'flagged'
                ? 'Flags you submit appear here until an admin resolves them.'
                : 'When shoppers review your products, they will show up here.'
            }
          />
        ) : (
          <PartnerCard>
            {mine.map((review) => {
              const productName = productNameById.get(review.productId) || 'Product';
              const flagged = review.flagStatus === 'pending';
              return (
                <article
                  key={review.id}
                  className="border-b border-border/70 px-4 py-5 last:border-0 sm:px-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{review.customerName || 'Customer'}</p>
                        {review.isVerified ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            Verified
                          </span>
                        ) : null}
                        {flagged ? (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                            Flagged · {productReviewFlagLabel(review.flagReason)}
                          </span>
                        ) : null}
                      </div>
                      <Link
                        href={`/products/${review.productId}`}
                        className="mt-0.5 block text-sm text-primary hover:underline"
                      >
                        {productName}
                      </Link>
                      <div className="mt-2 flex items-center gap-2">
                        <Stars rating={review.rating} />
                        <span className="text-xs text-muted-foreground">
                          {formatWhen(review.createdAt)}
                        </span>
                      </div>
                      {review.title ? (
                        <p className="mt-2 text-sm font-medium">{review.title}</p>
                      ) : null}
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {review.comment}
                      </p>
                      {flagged && review.flagNote ? (
                        <p className="mt-2 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-900/80">
                          Your note: {review.flagNote}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0">
                      {flagged ? (
                        <p className="text-xs text-muted-foreground sm:text-right">
                          Awaiting admin review
                        </p>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => setFlagTarget(review)}
                        >
                          <Flag className="h-3.5 w-3.5" />
                          Flag
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </PartnerCard>
        )}
      </PartnerPage>

      {flagTarget ? (
        <FlagReviewModal
          review={flagTarget}
          productName={productNameById.get(flagTarget.productId) || 'Product'}
          onClose={() => setFlagTarget(null)}
          onFlagged={() => setFlagTarget(null)}
        />
      ) : null}
    </SupplierShell>
  );
}
