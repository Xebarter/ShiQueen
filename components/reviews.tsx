'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  helpful: number;
  verified: boolean;
}

const mockReviews: Review[] = [
  {
    id: '1',
    author: 'Sarah M.',
    rating: 5,
    title: 'Absolutely Luxurious!',
    content:
      'This sweater is even more beautiful in person. The quality is exceptional and it arrived quickly. Highly recommend!',
    date: '2 weeks ago',
    helpful: 24,
    verified: true,
  },
  {
    id: '2',
    author: 'Emma T.',
    rating: 4,
    title: 'Great Quality, True to Size',
    content:
      'Love this piece. Very soft and fits perfectly. Only reason for 4 stars is that it pilled slightly after first wash.',
    date: '1 month ago',
    helpful: 18,
    verified: true,
  },
  {
    id: '3',
    author: 'Jessica L.',
    rating: 5,
    title: 'Perfect for Fall',
    content:
      'Bought this for fall and it&apos;s been perfect. Great layering piece, looks expensive, and is so comfortable!',
    date: '2 months ago',
    helpful: 42,
    verified: true,
  },
];

export function Reviews() {
  const [sortBy, setSortBy] = useState('helpful');

  const averageRating = (
    mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length
  ).toFixed(1);

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: mockReviews.filter((r) => r.rating === rating).length,
    percentage:
      (mockReviews.filter((r) => r.rating === rating).length / mockReviews.length) * 100,
  }));

  return (
    <div className="border-t border-border py-8 sm:py-12">
      <h2 className="mb-6 text-xl font-semibold sm:mb-8 sm:text-2xl">Customer reviews</h2>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-4 lg:mb-12">
        {/* Rating Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-0 sm:border-0 sm:bg-transparent">
            <div className="space-y-6">
              <div>
                <div className="mb-2 text-4xl font-semibold">{averageRating}</div>
                <div className="mb-2 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(parseFloat(averageRating))
                          ? 'fill-accent text-accent'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {mockReviews.length} reviews
                </p>
              </div>

              <Button className="hidden w-full sm:inline-flex">Write a review</Button>
            </div>

            {/* Rating Distribution */}
            <div className="mt-6 space-y-3 sm:mt-8">
              {ratingDistribution.map((dist) => (
                <div key={dist.rating} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{dist.rating} stars</span>
                    <span className="text-muted-foreground">{dist.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-3">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing all {mockReviews.length} reviews
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm sm:w-auto sm:py-1"
            >
              <option value="helpful">Most helpful</option>
              <option value="recent">Most recent</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </div>

          <div className="space-y-6">
            {mockReviews.map((review) => (
              <div key={review.id} className="border-b border-border pb-6">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{review.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {review.author} · {review.date}
                    </p>
                  </div>
                  {review.verified && (
                    <span className="w-fit shrink-0 rounded bg-accent/10 px-2 py-1 text-xs text-accent">
                      Verified purchase
                    </span>
                  )}
                </div>

                <div className="mb-3 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? 'fill-accent text-accent' : 'text-muted'
                      }`}
                    />
                  ))}
                </div>

                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{review.content}</p>

                <button className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
                  <ThumbsUp className="h-4 w-4" />
                  Helpful ({review.helpful})
                </button>
              </div>
            ))}
          </div>

          <Button className="mt-6 w-full sm:hidden">Write a review</Button>
        </div>
      </div>
    </div>
  );
}
