'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { subscribeProductReviews } from '@/lib/firebase/product-reviews';
import type { ProductReview } from '@/lib/types/database';
import { ProductReviewFormModal } from '@/components/product/product-review-form-modal';
import { cn } from '@/lib/utils';

type SortKey = 'recent' | 'highest' | 'lowest';

function formatReviewDate(date: Date) {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn('flex gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i <= Math.round(rating) ? 'fill-accent text-accent' : 'text-muted'
          )}
        />
      ))}
    </div>
  );
}

export function Reviews({
  productId,
  productName,
  fallbackRating = 0,
  fallbackCount = 0,
}: {
  productId: string;
  productName: string;
  fallbackRating?: number;
  fallbackCount?: number;
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeProductReviews(
      (next) => {
        setReviews(next.filter((review) => review.productId === productId && review.isVisible));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, [productId]);

  const sorted = useMemo(() => {
    const list = [...reviews];
    if (sortBy === 'highest') list.sort((a, b) => b.rating - a.rating || b.createdAt.getTime() - a.createdAt.getTime());
    else if (sortBy === 'lowest') list.sort((a, b) => a.rating - b.rating || b.createdAt.getTime() - a.createdAt.getTime());
    else list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return list;
  }, [reviews, sortBy]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return fallbackRating;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews, fallbackRating]);

  const reviewCount = reviews.length > 0 ? reviews.length : fallbackCount;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((r) => r.rating === rating).length;
    return {
      rating,
      count,
      percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
    };
  });

  const myReview = user ? reviews.find((review) => review.userId === user.uid) : undefined;

  return (
    <div className="border-t border-border py-8 sm:py-12">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-semibold sm:text-2xl">Customer reviews</h2>
        <Button
          type="button"
          className="hidden sm:inline-flex"
          onClick={() => setFormOpen(true)}
        >
          {myReview ? 'Edit your review' : 'Write a review'}
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:mb-12 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border/60 bg-card p-5 sm:border-0 sm:bg-transparent sm:p-0">
            <div className="space-y-6">
              <div>
                <div className="mb-2 text-4xl font-semibold tabular-nums">
                  {reviewCount > 0 ? averageRating.toFixed(1) : '—'}
                </div>
                <Stars rating={averageRating} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  {reviewCount > 0
                    ? `Based on ${reviewCount} review${reviewCount === 1 ? '' : 's'}`
                    : 'No reviews yet'}
                </p>
              </div>

              <div className="space-y-3">
                {ratingDistribution.map((dist) => (
                  <div key={dist.rating} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{dist.rating} stars</span>
                      <span className="tabular-nums text-muted-foreground">{dist.count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-accent transition-[width]"
                        style={{ width: `${dist.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {loading
                ? 'Loading reviews…'
                : sorted.length > 0
                  ? `Showing ${sorted.length} review${sorted.length === 1 ? '' : 's'}`
                  : 'Be the first to review this product'}
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm sm:w-auto sm:py-1"
            >
              <option value="recent">Most recent</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No customer reviews yet. Share your experience after your order arrives.
              </p>
              <Button type="button" className="mt-4" onClick={() => setFormOpen(true)}>
                Write a review
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {sorted.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        {review.title.trim() || `${review.rating}-star review`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {review.customerName || 'Customer'} · {formatReviewDate(review.createdAt)}
                      </p>
                    </div>
                    {review.isVerified ? (
                      <span className="w-fit shrink-0 rounded bg-accent/10 px-2 py-1 text-xs text-accent">
                        Verified purchase
                      </span>
                    ) : null}
                  </div>

                  <Stars rating={review.rating} className="mb-3" />
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            className="mt-6 w-full sm:hidden"
            onClick={() => setFormOpen(true)}
          >
            {myReview ? 'Edit your review' : 'Write a review'}
          </Button>
        </div>
      </div>

      <ProductReviewFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        productId={productId}
        productName={productName}
      />
    </div>
  );
}
