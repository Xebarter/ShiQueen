'use client';

import { BadgeCheck, Clock, Phone, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ServicesHeroProps {
  totalServices: number;
  totalProviders: number;
}

export function ServicesHero({ totalServices, totalProviders }: ServicesHeroProps) {
  const scrollToBrowse = () => {
    document.getElementById('services-browse')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/[0.07] via-background to-accent/10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] [background-size:3rem_3rem]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3 w-3" />
              Services
            </span>
            <h1 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
              Book trusted{' '}
              <span className="font-semibold text-primary">beauty &amp; wellness</span> pros
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-card/90 px-4 py-2.5 shadow-sm backdrop-blur-sm">
                <div className="text-left">
                  <p className="text-lg font-semibold leading-none tabular-nums">{totalServices}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Services
                  </p>
                </div>
                <div className="h-8 w-px bg-border/70" />
                <div className="text-left">
                  <p className="text-lg font-semibold leading-none tabular-nums">{totalProviders}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Providers
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: BadgeCheck, label: 'Verified' },
                  { icon: Clock, label: 'Book in 60s' },
                  { icon: Phone, label: 'Call / WhatsApp' },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm"
                  >
                    <Icon className="h-3 w-3 text-primary" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <Button
              size="lg"
              className="h-12 rounded-2xl px-8 font-semibold shadow-lg shadow-primary/25"
              onClick={scrollToBrowse}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Browse services
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
