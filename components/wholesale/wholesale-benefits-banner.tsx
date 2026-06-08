'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type WholesaleBenefitsBannerProps = {
  catalogSize: number;
  className?: string;
};

export function WholesaleBenefitsBanner({ catalogSize, className }: WholesaleBenefitsBannerProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-background to-accent/[0.06]',
        className
      )}
    >
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-light tracking-tight sm:text-3xl lg:text-4xl">
            Wholesale <span className="font-semibold text-primary">bulk ordering</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {catalogSize} products · volume pricing · free shipping
          </p>
        </div>

        <Link
          href="/packages"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-border/70 bg-card px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-primary/30 hover:shadow-md sm:self-center"
        >
          Bundle deals
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
