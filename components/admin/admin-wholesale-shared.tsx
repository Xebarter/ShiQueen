'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BulkOrder, Package, WholesaleAccount } from '@/lib/types/wholesale';
import { cn } from '@/lib/utils';

export const BULK_ORDER_STATUS: Record<
  BulkOrder['status'],
  { label: string; className: string }
> = {
  draft: { label: 'Draft', className: 'bg-slate-500/10 text-slate-700 ring-slate-500/20' },
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-700 ring-amber-500/20' },
  approved: { label: 'Approved', className: 'bg-sky-500/10 text-sky-700 ring-sky-500/20' },
  shipped: { label: 'Shipped', className: 'bg-violet-500/10 text-violet-700 ring-violet-500/20' },
  delivered: { label: 'Delivered', className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-700 ring-red-500/20' },
};

export const ACCOUNT_STATUS: Record<
  WholesaleAccount['status'],
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-700 ring-amber-500/20' },
  approved: { label: 'Approved', className: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20' },
  rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-700 ring-red-500/20' },
  suspended: { label: 'Suspended', className: 'bg-slate-500/10 text-slate-700 ring-slate-500/20' },
};

export function formatWholesaleRef(id: string): string {
  if (id.length <= 12) return id.toUpperCase();
  return `#${id.slice(-8).toUpperCase()}`;
}

export function formatWholesaleDate(date: Date): string {
  return new Intl.DateTimeFormat('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date instanceof Date ? date : new Date(date));
}

export function packageRuleLabel(rule: Package['rule']): string {
  switch (rule.type) {
    case 'fixed':
      return 'Fixed bundle';
    case 'customizable':
      return 'Customizable';
    case 'mix-and-match':
      return 'Mix & match';
    default:
      return rule.type;
  }
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn('mt-1 truncate text-2xl font-bold tabular-nums', accent)}>{value}</p>
        </div>
        <span className={cn('shrink-0 rounded-lg bg-muted p-2', accent)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export function StatusBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        className
      )}
    >
      {label}
    </span>
  );
}

export function BulkOrderStatusBadge({ status }: { status: BulkOrder['status'] }) {
  const config = BULK_ORDER_STATUS[status];
  return <StatusBadge label={config.label} className={config.className} />;
}

export function AccountStatusBadge({ status }: { status: WholesaleAccount['status'] }) {
  const config = ACCOUNT_STATUS[status];
  return <StatusBadge label={config.label} className={config.className} />;
}

export function PackageActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <StatusBadge
      label={isActive ? 'Active' : 'Inactive'}
      className={
        isActive
          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20'
          : 'bg-slate-500/10 text-slate-600 ring-slate-500/20'
      }
    />
  );
}

export function AdminWholesaleBackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function QuickNavCard({
  href,
  title,
  description,
  icon: Icon,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      <span className="rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/15">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{title}</p>
          {badge !== undefined && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
