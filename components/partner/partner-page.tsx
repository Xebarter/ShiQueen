import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PartnerPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('partner-page-shell px-4 py-4 pb-28 sm:px-6 sm:py-6 md:p-8 md:pb-8', className)}>
      {children}
    </div>
  );
}

export function PartnerPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap justify-end gap-2 md:ml-6 [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center [&_button]:inline-flex">
          {action}
        </div>
      )}
    </div>
  );
}

export function PartnerCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-sm',
        'shadow-[var(--partner-card-shadow,0_4px_20px_oklch(0.40_0.13_340_/_5%))]',
        'backdrop-blur-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

export function PartnerFormCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-xl space-y-5 rounded-2xl border border-border/60 bg-card/95 p-5 shadow-sm',
        'shadow-[var(--partner-card-shadow,0_4px_20px_oklch(0.40_0.13_340_/_5%))] sm:p-6',
        className
      )}
    >
      {children}
    </div>
  );
}

export function PartnerEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-primary/15 bg-gradient-to-b from-card to-secondary/30 px-6 py-14 text-center shadow-sm">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function PartnerStatCard({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  href: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_12px_32px_oklch(0.40_0.13_340_/_8%)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold tabular-nums">{value}</p>
        </div>
        <span className="shrink-0 rounded-xl bg-gradient-to-br from-primary/12 to-primary/5 p-2.5 text-primary ring-1 ring-primary/10">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
        View
        <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </p>
    </Link>
  );
}

export function PartnerStatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'pending' | 'confirmed' | 'progress' | 'completed' | 'cancelled' | 'active' | 'hidden' | 'neutral';
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        tone === 'pending' && 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
        tone === 'confirmed' && 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
        tone === 'progress' && 'bg-violet-500/10 text-violet-700 ring-violet-500/20',
        tone === 'completed' && 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
        tone === 'cancelled' && 'bg-red-500/10 text-red-700 ring-red-500/20',
        tone === 'active' && 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
        tone === 'hidden' && 'bg-slate-500/10 text-slate-700 ring-slate-500/20',
        tone === 'neutral' && 'bg-muted text-muted-foreground ring-border'
      )}
    >
      {children}
    </span>
  );
}

export function PartnerSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}
