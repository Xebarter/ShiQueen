'use client';

import Link from 'next/link';
import { ArrowRight, Package, ShieldCheck, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

type WholesaleBenefitsBannerProps = {
  catalogSize: number;
  className?: string;
};

export function WholesaleBenefitsBanner({ catalogSize, className }: WholesaleBenefitsBannerProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border/60',
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,oklch(0.40_0.13_340/0.08),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_20%,oklch(0.72_0.08_55/0.07),transparent_50%)]" />
      <div className="relative mx-auto max-w-[90rem] px-3 py-8 sm:px-4 sm:py-10 lg:px-5 lg:py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          Wholesale
        </p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-[family-name:var(--font-brand)] text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Trade pricing for fashion &amp; beauty
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Volume rates for retailers and resellers in Uganda. Build a bulk order, review
              savings, and checkout with free shipping.
            </p>
          </div>
          <Link
            href="/packages"
            className="inline-flex shrink-0 items-center gap-2 self-start border-b border-foreground/25 pb-1 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary lg:self-end"
          >
            View packages
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 sm:grid-cols-3">
          <div className="flex items-center gap-3 bg-background/90 px-4 py-3.5 backdrop-blur-sm">
            <Package className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold tabular-nums">{catalogSize} products</p>
              <p className="text-xs text-muted-foreground">Wholesale catalog</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-background/90 px-4 py-3.5 backdrop-blur-sm">
            <Truck className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Free shipping</p>
              <p className="text-xs text-muted-foreground">On wholesale orders</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-background/90 px-4 py-3.5 backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Volume tiers</p>
              <p className="text-xs text-muted-foreground">Better rates at scale</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
