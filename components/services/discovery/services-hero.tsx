'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2400&q=80';

interface ServicesHeroProps {
  totalServices: number;
  totalProviders: number;
}

export function ServicesHero({ totalServices, totalProviders }: ServicesHeroProps) {
  const scrollToBrowse = () => {
    document.getElementById('services-browse')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative isolate min-h-[78vh] overflow-hidden border-b border-border/40 sm:min-h-[85vh]">
      <Image
        src={HERO_IMAGE}
        alt="Beauty and wellness styling"
        fill
        priority
        className="object-cover object-[center_30%]"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/25"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-4 pb-14 pt-28 sm:min-h-[85vh] sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-xl"
        >
          <p className="font-[family-name:var(--font-brand)] text-4xl font-medium tracking-tight text-primary sm:text-5xl lg:text-6xl">
            ShiQueen
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-brand)] text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            Book beauty, hair &amp; nail services in Kampala
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Reserve trusted makeup artists, salons, and stylists across Uganda — pay securely
            upfront, or send a link for someone else to cover it.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              className="h-12 rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25"
              onClick={scrollToBrowse}
            >
              Book a service
            </Button>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="mt-10 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          {totalServices} services · {totalProviders} providers · Pay with mobile money
        </motion.p>
      </div>
    </section>
  );
}
