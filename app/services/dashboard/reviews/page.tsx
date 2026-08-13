'use client';

import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { ProviderShell } from '@/components/provider/provider-shell';
import {
  PartnerCard,
  PartnerEmptyState,
  PartnerPage,
  PartnerPageHeader,
} from '@/components/partner/partner-page';
import { useAuth } from '@/lib/auth-context';
import { useServices } from '@/lib/services-context';

export default function ProviderReviewsPage() {
  const { providerId } = useAuth();
  const { reviews } = useServices();

  const mine = useMemo(
    () => reviews.filter((r) => r.providerId === providerId && r.isVisible),
    [reviews, providerId]
  );

  return (
    <ProviderShell>
      <PartnerPage>
        <PartnerPageHeader
          eyebrow="Studio"
          title="Reviews"
          description="What clients say after completed bookings."
        />
        {mine.length === 0 ? (
          <PartnerEmptyState
            icon={Star}
            title="No reviews yet"
            description="Reviews from completed bookings will show up here."
          />
        ) : (
          <PartnerCard>
            {mine.map((review) => (
              <article
                key={review.id}
                className="border-b border-[var(--partner-line)] px-5 py-5 last:border-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{review.customerName}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F4EBD4] px-2.5 py-0.5 text-[11px] font-semibold text-[#8A6A2A]">
                    <Star className="h-3 w-3 fill-current" />
                    {review.rating}/5
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
              </article>
            ))}
          </PartnerCard>
        )}
      </PartnerPage>
    </ProviderShell>
  );
}
