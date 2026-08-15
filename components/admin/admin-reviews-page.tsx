'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Flag,
  Loader2,
  ShieldAlert,
  Star,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page';
import { AdminSelectCheckbox } from '@/components/admin/admin-bulk-approve';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  deleteProductReviews,
  dismissProductReviewFlag,
  productReviewFlagLabel,
  subscribeProductReviews,
} from '@/lib/firebase/product-reviews';
import { useProducts } from '@/lib/products-context';
import type { ProductReview } from '@/lib/types/database';
import { cn } from '@/lib/utils';

type QueueFilter = 'pending' | 'all' | 'dismissed';

function formatWhen(date?: Date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
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

export function AdminReviewsPage() {
  const { products, getProductById } = useProducts();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<QueueFilter>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeProductReviews(
      (next) => {
        setReviews(next);
        setLoading(false);
      },
      () => {
        toast.error('Failed to load reviews');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const pending = useMemo(
    () => reviews.filter((review) => review.flagStatus === 'pending'),
    [reviews]
  );
  const dismissed = useMemo(
    () => reviews.filter((review) => review.flagStatus === 'dismissed'),
    [reviews]
  );

  const visible = useMemo(() => {
    if (filter === 'pending') return pending;
    if (filter === 'dismissed') return dismissed;
    return [...reviews].sort((a, b) => {
      const rank = (status: string) =>
        status === 'pending' ? 0 : status === 'dismissed' ? 1 : 2;
      return rank(a.flagStatus) - rank(b.flagStatus) || b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [filter, pending, dismissed, reviews]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => visible.some((review) => review.id === id)));
  }, [visible]);

  const allSelected = visible.length > 0 && selectedIds.length === visible.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id)
    );
  };

  const handleDismiss = async (id: string) => {
    setBusy(true);
    try {
      await dismissProductReviewFlag(id);
      toast.success('Flag dismissed — review stays live');
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not dismiss flag');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Delete ${selectedIds.length} review${selectedIds.length === 1 ? '' : 's'} permanently? This cannot be undone.`
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      const count = await deleteProductReviews(selectedIds);
      toast.success(`Deleted ${count} review${count === 1 ? '' : 's'}`);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete reviews');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    setBusy(true);
    try {
      await deleteProductReviews([id]);
      toast.success('Review deleted');
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete review');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Review moderation"
        description="Supplier-flagged product reviews awaiting your decision"
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Pending flags
              </p>
              <p className="text-2xl font-semibold tabular-nums">{pending.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Dismissed
              </p>
              <p className="text-2xl font-semibold tabular-nums">{dismissed.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                All reviews
              </p>
              <p className="text-2xl font-semibold tabular-nums">{reviews.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(
            [
              { id: 'pending' as const, label: `Queue${pending.length ? ` (${pending.length})` : ''}` },
              { id: 'dismissed' as const, label: 'Dismissed' },
              { id: 'all' as const, label: 'All reviews' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition',
                filter === item.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visible.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <AdminSelectCheckbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={(checked) =>
                setSelectedIds(checked ? visible.map((review) => review.id) : [])
              }
              label="Select all"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || selectedIds.length === 0}
              onClick={() => void handleDeleteSelected()}
              className="gap-1.5 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete selected{selectedIds.length ? ` (${selectedIds.length})` : ''}
            </Button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <Card className="border-dashed border-border/70 shadow-none">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Flag className="mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="font-medium text-foreground/85">
              {filter === 'pending' ? 'Moderation queue is clear' : 'Nothing to show'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {filter === 'pending'
                ? 'When suppliers flag a review, it will appear here for you to keep or remove.'
                : 'Try another filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((review) => {
            const product = getProductById(review.productId) ?? products.find((p) => p.id === review.productId);
            const selected = selectedIds.includes(review.id);
            const pendingFlag = review.flagStatus === 'pending';

            return (
              <Card
                key={review.id}
                className={cn(
                  'overflow-hidden border-border/70 shadow-sm transition',
                  pendingFlag && 'ring-1 ring-amber-500/20',
                  selected && 'border-primary/30 bg-primary/[0.02]'
                )}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                    <div className="pt-1">
                      <AdminSelectCheckbox
                        checked={selected}
                        onChange={(checked) => toggleOne(review.id, checked)}
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold tracking-tight">
                              {review.customerName || 'Customer'}
                            </p>
                            <Stars rating={review.rating} />
                            {review.isVerified ? (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Verified
                              </span>
                            ) : null}
                            {pendingFlag ? (
                              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                Needs review
                              </span>
                            ) : review.flagStatus === 'dismissed' ? (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Dismissed
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            On{' '}
                            <Link
                              href={`/products/${review.productId}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {product?.name || review.productId}
                            </Link>
                            {' · '}
                            {formatWhen(review.createdAt)}
                          </p>
                        </div>
                      </div>

                      {review.title ? (
                        <p className="text-sm font-medium">{review.title}</p>
                      ) : null}
                      <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
                        {review.comment}
                      </p>

                      {(pendingFlag || review.flagStatus === 'dismissed') && (
                        <div className="rounded-xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.07] to-transparent px-3.5 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800/80">
                            Supplier flag
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {productReviewFlagLabel(review.flagReason)}
                          </p>
                          {review.flagNote ? (
                            <p className="mt-1 text-sm text-muted-foreground">{review.flagNote}</p>
                          ) : null}
                          <p className="mt-2 text-xs text-muted-foreground">
                            Flagged {formatWhen(review.flaggedAt)}
                            {review.flagStatus === 'dismissed'
                              ? ` · Resolved ${formatWhen(review.flagResolvedAt)}`
                              : ''}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                      {pendingFlag ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void handleDismiss(review.id)}
                          className="gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Keep review
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void handleDeleteOne(review.id)}
                        className="gap-1.5 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
