import { getSupabaseClient } from '@/lib/supabase/client';
import { subscribeTable, type Unsubscribe } from '@/lib/supabase/realtime';
import { stripUndefined } from '@/lib/supabase/sanitize';
import { TABLES } from '@/lib/supabase/tables';
import { toDate } from '@/lib/supabase/timestamp';
import type {
  ProductReview,
  ProductReviewFlagReason,
  ProductReviewFlagStatus,
} from '@/lib/types/database';

function mapFlagStatus(value: unknown): ProductReviewFlagStatus {
  if (value === 'pending' || value === 'dismissed' || value === 'none') return value;
  return 'none';
}

function mapReview(row: Record<string, unknown>): ProductReview {
  return {
    id: String(row.id),
    productId: String(row.product_id ?? ''),
    orderId: row.order_id ? String(row.order_id) : undefined,
    userId: String(row.user_id ?? ''),
    rating: Number(row.rating ?? 0),
    title: String(row.title ?? ''),
    comment: String(row.comment ?? ''),
    customerName: String(row.customer_name ?? ''),
    isVerified: Boolean(row.is_verified ?? false),
    isVisible: Boolean(row.is_visible ?? true),
    isFlagged: Boolean(row.is_flagged ?? false),
    flagStatus: mapFlagStatus(row.flag_status),
    flagReason: String(row.flag_reason ?? ''),
    flagNote: String(row.flag_note ?? ''),
    flaggedBy: row.flagged_by ? String(row.flagged_by) : undefined,
    flaggedAt: row.flagged_at ? toDate(row.flagged_at) : undefined,
    flagResolvedAt: row.flag_resolved_at ? toDate(row.flag_resolved_at) : undefined,
    flagResolvedBy: row.flag_resolved_by ? String(row.flag_resolved_by) : undefined,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function reviewToRow(data: Partial<ProductReview> & { id?: string }): Record<string, unknown> {
  return stripUndefined({
    id: data.id,
    product_id: data.productId,
    order_id: data.orderId,
    user_id: data.userId,
    rating: data.rating,
    title: data.title,
    comment: data.comment,
    customer_name: data.customerName,
    is_verified: data.isVerified,
    is_visible: data.isVisible,
  });
}

async function fetchProductReviews(): Promise<ProductReview[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.productReviews)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapReview(row as Record<string, unknown>));
}

export function subscribeProductReviews(
  onData: (reviews: ProductReview[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeTable(TABLES.productReviews, fetchProductReviews, onData, onError);
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TABLES.productReviews)
    .select('*')
    .eq('product_id', productId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapReview(row as Record<string, unknown>));
}

export async function getUserProductReview(
  productId: string,
  userId: string
): Promise<ProductReview | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLES.productReviews)
    .select('*')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapReview(data as Record<string, unknown>);
}

export async function userDeliveredProduct(productId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc('user_delivered_product', {
    p_product_id: productId,
  });

  if (error) {
    console.error('user_delivered_product failed:', error);
    return false;
  }
  return Boolean(data);
}

export function generateProductReviewId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `prev-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }
  return `prev-${Date.now().toString(36)}`;
}

export async function upsertProductReview(review: {
  id: string;
  productId: string;
  orderId?: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  customerName: string;
  isVerified: boolean;
  isVisible?: boolean;
}): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.from(TABLES.productReviews).upsert(
    reviewToRow({
      ...review,
      isVisible: review.isVisible ?? true,
    }),
    { onConflict: 'product_id,user_id' }
  );

  if (error) throw error;
}

export async function flagProductReview(
  reviewId: string,
  reason: ProductReviewFlagReason,
  note = ''
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.rpc('flag_product_review', {
    p_review_id: reviewId,
    p_reason: reason,
    p_note: note,
  });

  if (error) throw new Error(error.message || 'Could not flag review');

  void import('@/lib/pwa/notify-client').then(({ notifyAdminFlaggedReviewClients }) =>
    notifyAdminFlaggedReviewClients(reviewId)
  );
}

export async function dismissProductReviewFlag(reviewId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase.rpc('dismiss_product_review_flag', {
    p_review_id: reviewId,
  });

  if (error) throw new Error(error.message || 'Could not dismiss flag');
}

export async function deleteProductReviews(reviewIds: string[]): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not initialized');
  if (reviewIds.length === 0) return 0;

  const { data, error } = await supabase.rpc('delete_product_reviews', {
    p_review_ids: reviewIds,
  });

  if (error) throw new Error(error.message || 'Could not delete reviews');
  return Number(data ?? 0);
}

export function productReviewFlagLabel(reason: string): string {
  switch (reason) {
    case 'inappropriate':
      return 'Inappropriate';
    case 'spam':
      return 'Spam';
    case 'fake':
      return 'Suspicious / fake';
    case 'off_topic':
      return 'Off-topic';
    case 'other':
      return 'Other';
    default:
      return reason || 'Flagged';
  }
}
