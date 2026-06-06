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
    <div className="py-12 border-t border-border">
      <h2 className="text-2xl font-semibold mb-8">Customer Reviews</h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        {/* Rating Summary */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <div>
              <div className="text-4xl font-semibold mb-2">{averageRating}</div>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
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

            <Button className="w-full">Write a Review</Button>
          </div>

          {/* Rating Distribution */}
          <div className="mt-8 space-y-3">
            {ratingDistribution.map((dist) => (
              <div key={dist.rating} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{dist.rating} stars</span>
                  <span className="text-muted-foreground">{dist.count}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full"
                    style={{ width: `${dist.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-3">
          <div className="mb-6 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing all {mockReviews.length} reviews
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm px-3 py-1 border border-border rounded-lg bg-background"
            >
              <option value="helpful">Most Helpful</option>
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>

          <div className="space-y-6">
            {mockReviews.map((review) => (
              <div key={review.id} className="border-b border-border pb-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{review.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {review.author} • {review.date}
                    </p>
                  </div>
                  {review.verified && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                      Verified Purchase
                    </span>
                  )}
                </div>

                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating ? 'fill-accent text-accent' : 'text-muted'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-muted-foreground text-sm mb-4">{review.content}</p>

                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({review.helpful})
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
