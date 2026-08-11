'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronsUpDown, Plus, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useSuppliers } from '@/lib/suppliers-context';
import { cn } from '@/lib/utils';

type SupplierSelectProps = {
  value: string;
  onChange: (supplierId: string) => void;
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function SupplierSelect({
  value,
  onChange,
  label = 'Supplier',
  hint = 'Who supplies this item',
  required = true,
  disabled = false,
  className,
  id = 'supplierId',
}: SupplierSelectProps) {
  const { suppliers, loading, defaultSupplierId } = useSuppliers();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value && defaultSupplierId) {
      onChange(defaultSupplierId);
    }
    // Intentionally omit onChange — parents often pass inline setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, defaultSupplierId]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const options = useMemo(() => {
    const active = suppliers.filter(
      (s) => s.isActive || s.id === value
    );
    const q = query.trim().toLowerCase();
    if (!q) return active;
    return active.filter((s) => {
      const haystack = [s.name, s.companyName, s.contactName, s.email, s.phone, s.city]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [suppliers, query, value]);

  const selected = suppliers.find((s) => s.id === value);

  return (
    <div ref={rootRef} className={cn('space-y-2', className)}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <Label htmlFor={id}>
            {label}
            {required ? ' *' : ''}
          </Label>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <Link
          href="/admin/suppliers/new"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Link>
      </div>

      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled || loading}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm transition',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <span className="min-w-0 truncate">
            {selected ? (
              <>
                <span className="font-medium">{selected.name}</span>
                {selected.companyName && selected.companyName !== selected.name && (
                  <span className="text-muted-foreground"> · {selected.companyName}</span>
                )}
                {selected.isDefault && (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Default
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">
                {loading ? 'Loading suppliers…' : 'Select a supplier'}
              </span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </button>

        {open && (
          <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="relative border-b border-border/70 p-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search suppliers…"
                className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {options.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No suppliers match “{query}”
                </li>
              ) : (
                options.map((supplier) => {
                  const isSelected = supplier.id === value;
                  return (
                    <li key={supplier.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(supplier.id);
                          setOpen(false);
                          setQuery('');
                        }}
                        className={cn(
                          'flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition hover:bg-muted/60',
                          isSelected && 'bg-primary/5'
                        )}
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="font-medium">{supplier.name}</span>
                          <span className="flex items-center gap-1.5">
                            {supplier.isDefault && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                                Default
                              </span>
                            )}
                            {!supplier.isActive && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                                Inactive
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {[supplier.companyName, supplier.city, supplier.phone]
                            .filter(Boolean)
                            .join(' · ') || 'No contact details'}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
