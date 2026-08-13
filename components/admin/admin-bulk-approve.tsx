'use client';

import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AdminSelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [checked, indeterminate]);

  return (
    <label
      className={cn('inline-flex cursor-pointer items-center gap-2 text-sm select-none', className)}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-border accent-primary"
      />
      {label ? <span>{label}</span> : <span className="sr-only">Select</span>}
    </label>
  );
}

export function AdminBulkApproveBar({
  pendingCount,
  selectedCount,
  allSelected,
  someSelected,
  onToggleAll,
  onApproveSelected,
  busy,
  noun,
}: {
  pendingCount: number;
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: (checked: boolean) => void;
  onApproveSelected: () => void;
  busy: boolean;
  noun: string;
}) {
  if (pendingCount === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <AdminSelectCheckbox
        checked={allSelected}
        indeterminate={someSelected}
        onChange={onToggleAll}
        label={`Select all pending (${pendingCount})`}
      />
      <Button
        size="sm"
        disabled={busy || selectedCount === 0}
        onClick={onApproveSelected}
        className="gap-1"
      >
        <Check className="h-3.5 w-3.5" />
        {selectedCount > 0
          ? `Approve ${selectedCount === pendingCount ? 'all' : 'selected'} (${selectedCount})`
          : `Approve ${noun}s`}
      </Button>
    </div>
  );
}
