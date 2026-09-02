'use client';

import { cn } from '@/lib/utils';

export function SettingsSwitch({
  checked,
  disabled,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        checked ? 'bg-emerald-600' : 'bg-muted ring-1 ring-inset ring-border',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );
}

export function ActiveBadge({ label = 'Active' }: { label?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
      {label}
    </span>
  );
}

export function OffBadge({ label = 'Off' }: { label?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-inset ring-border">
      {label}
    </span>
  );
}
