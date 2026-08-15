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
        'inline-flex items-center overflow-hidden rounded-lg border border-border/80 bg-background',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={disabled || quantity <= min}
        aria-label="Decrease quantity"
        className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={quantity}
        onChange={(e) => handleInput(e.target.value)}
        disabled={disabled}
        aria-label="Quantity"
        className="h-10 w-12 border-x border-border/80 bg-transparent text-center text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/25"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={disabled || quantity >= max}
        aria-label="Increase quantity"
        className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
