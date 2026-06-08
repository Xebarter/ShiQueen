'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type BulkQuantityStepperProps = {
  quantity: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (quantity: number) => void;
  className?: string;
};

export function BulkQuantityStepper({
  quantity,
  min,
  max,
  disabled,
  onChange,
  className,
}: BulkQuantityStepperProps) {
  const handleInput = (value: string) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      onChange(min);
      return;
    }
    onChange(Math.min(max, Math.max(min, parsed)));
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl border border-border/80 bg-background shadow-sm',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={disabled || quantity <= min}
        aria-label="Decrease quantity"
        className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={quantity}
        onChange={(e) => handleInput(e.target.value)}
        disabled={disabled}
        aria-label="Quantity"
        className="h-11 w-14 border-x border-border/80 bg-transparent text-center text-base font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={disabled || quantity >= max}
        aria-label="Increase quantity"
        className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
