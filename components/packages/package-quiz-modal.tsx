'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PackageCategoryId } from '@/lib/package-catalog';
import { cn } from '@/lib/utils';

export interface PackageQuizResult {
  category?: PackageCategoryId;
  maxPrice?: number;
  sort: 'savings' | 'price-low' | 'price-high';
}

interface PackageQuizModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (result: PackageQuizResult) => void;
}

const OCCASION_OPTIONS: {
  label: string;
  category?: PackageCategoryId;
}[] = [
  { label: 'A gift for someone special', category: 'gift' },
  { label: 'Bridal or wedding', category: 'bridal' },
  { label: 'Self-care & pampering', category: 'self-care' },
  { label: 'Work & professional life', category: 'corporate-woman' },
  { label: 'Student / campus life', category: 'student' },
  { label: 'Beauty & everyday glow', category: 'beauty' },
];

const BUDGET_OPTIONS: {
  label: string;
  maxPrice?: number;
  sort: PackageQuizResult['sort'];
}[] = [
  { label: 'Under UGX 50,000', maxPrice: 50000, sort: 'price-low' },
  { label: 'Under UGX 100,000', maxPrice: 100000, sort: 'savings' },
  { label: 'Premium / luxury', sort: 'price-high' },
  { label: 'Best savings — any budget', sort: 'savings' },
];

export function PackageQuizModal({ open, onClose, onComplete }: PackageQuizModalProps) {
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState<PackageCategoryId | undefined>();
  const [budget, setBudget] = useState<(typeof BUDGET_OPTIONS)[0] | null>(null);

  const reset = () => {
    setStep(0);
    setOccasion(undefined);
    setBudget(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const finish = () => {
    if (!budget) return;
    onComplete({
      category: occasion,
      maxPrice: budget.maxPrice,
      sort: budget.sort,
    });
    handleClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Find your perfect package</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-6 flex gap-2">
            {[0, 1].map((s) => (
              <div
                key={s}
                className={cn(
                  'h-1 flex-1 rounded-full',
                  step >= s ? 'bg-primary' : 'bg-border'
                )}
              />
            ))}
          </div>

          {step === 0 && (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">
                What are you shopping for today?
              </p>
              <div className="space-y-2">
                {OCCASION_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setOccasion(opt.category)}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-left text-sm transition',
                      occasion === opt.category
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Button className="mt-6 h-11 w-full rounded-xl" onClick={() => setStep(1)}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">What&apos;s your budget?</p>
              <div className="space-y-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setBudget(opt)}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-left text-sm transition',
                      budget?.label === opt.label
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="h-11 flex-1 rounded-xl" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button
                  className="h-11 flex-1 rounded-xl"
                  disabled={!budget}
                  onClick={finish}
                >
                  Show my bundles
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
