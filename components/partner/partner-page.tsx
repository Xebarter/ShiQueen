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
    <div className={cn('relative mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 md:p-10 md:pb-10', className)}>
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
    <div className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
            {eyebrow}
          </p>
        )}
        <h1 className="font-brand text-[1.85rem] font-medium leading-tight tracking-tight text-[var(--partner-ink)] sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap gap-2 md:ml-6 [&_a]:inline-flex [&_a]:h-10 [&_a]:items-center [&_a]:rounded-full [&_a]:px-4 [&_button]:inline-flex [&_button]:h-10 [&_button]:rounded-full">
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
    <div className={cn('partner-surface overflow-hidden rounded-[1.4rem]', className)}>
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
        'partner-surface max-w-xl space-y-5 rounded-[1.4rem] p-5 sm:p-6',
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
    <div className="partner-surface rounded-[1.4rem] px-6 py-16 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F8E8EE] text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="font-brand text-2xl font-medium tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

const STAT_TONES = {
  rose: 'bg-[#F8E8EE] text-[#8A3D5A]',
  gold: 'bg-[#F4EBD4] text-[#8A6A2A]',
  sage: 'bg-[#E6F0EA] text-[#3D6A52]',
  plum: 'bg-[#EDE6F2] text-[#5C4A72]',
} as const;

export function PartnerStatCard({
  label,
  value,
  href,
  icon: Icon,
  tone = 'rose',
}: {
  label: string;
  value: string | number;
  href: string;
  icon: LucideIcon;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <Link
      href={href}
      className="partner-surface group rounded-[1.4rem] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-brand text-3xl font-medium tabular-nums tracking-tight">
            {value}
          </p>
        </div>
        <span className={cn('rounded-2xl p-2.5', STAT_TONES[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
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
        'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
        tone === 'pending' && 'bg-[#F8EBD8] text-[#8A5A1E]',
        tone === 'confirmed' && 'bg-[#E7F0F7] text-[#3D5A73]',
        tone === 'progress' && 'bg-[#EFE8F6] text-[#5C4A72]',
        tone === 'completed' && 'bg-[#E5F2EA] text-[#2F5A40]',
        tone === 'cancelled' && 'bg-[#F6E4E6] text-[#7A3B42]',
        tone === 'active' && 'bg-[#E5F2EA] text-[#2F5A40]',
        tone === 'hidden' && 'bg-[#F1ECE8] text-[#6B5E56]',
        tone === 'neutral' && 'bg-[#F4EEEA] text-[#6B5E56]'
      )}
    >
      {children}
    </span>
  );
}

export function PartnerSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h2>
  );
}
