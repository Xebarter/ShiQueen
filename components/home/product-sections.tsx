'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useLightScroll } from '@/lib/hooks/use-light-scroll';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  urgency?: string;
  children: ReactNode;
  className?: string;
}

export function ProductSection({
  title,
  subtitle,
  href,
  linkLabel = 'View all',
  urgency,
  children,
  className = '',
}: ProductSectionProps) {
  const lightScroll = useLightScroll();
  const Header = lightScroll ? 'div' : motion.div;
  const showHeader = Boolean(title || urgency || href);

  const headerProps = lightScroll
    ? { className: 'mb-3 flex items-center justify-between gap-3 md:mb-4' }
    : {
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        className: 'mb-3 flex items-center justify-between gap-3 md:mb-4',
      };

  return (
    <section className={`scroll-section py-5 md:py-7 ${className}`}>
      <div className="mx-auto max-w-[90rem] px-3 sm:px-4 lg:px-5">
        {showHeader && (
          <Header {...headerProps}>
            <div className="flex min-w-0 items-center gap-2">
              {urgency && (
                <span className="shrink-0 rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  {urgency}
                </span>
              )}
              {title ? (
                <h2 className="truncate text-xl font-light tracking-tight md:text-2xl">{title}</h2>
              ) : null}
            </div>
            {href && (
              <Link href={href} className="shrink-0">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  {linkLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </Header>
        )}
        {subtitle ? (
          <p className="-mt-1 mb-3 text-sm text-muted-foreground md:mb-4">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}

interface ProductCarouselProps {
  children: ReactNode;
}

export function ProductCarousel({ children }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lightScroll = useLightScroll();

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (lightScroll) {
    return <div className="grid grid-cols-2 gap-2.5 pb-2 md:gap-3">{children}</div>;
  }

  return (
    <div className="group/carousel relative">
      <button
        onClick={() => scroll('left')}
        className="absolute top-1/3 left-0 z-10 hidden h-9 w-9 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 shadow-md opacity-0 backdrop-blur transition group-hover/carousel:opacity-100 md:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute top-1/3 right-0 z-10 hidden h-9 w-9 translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 shadow-md opacity-0 backdrop-blur transition group-hover/carousel:opacity-100 md:flex"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div
        ref={scrollRef}
        className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-2 scrollbar-hide md:gap-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  );
}

export function CarouselItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 w-full md:w-[240px] md:shrink-0 md:snap-start lg:w-[260px] ${className}`}
    >
      {children}
    </div>
  );
}

interface CategoryShowcaseProps {
  title: string;
  subtitle?: string;
  href: string;
  gradient?: string;
  children: ReactNode;
}

export function CategoryShowcase({
  title,
  subtitle,
  href,
  children,
}: CategoryShowcaseProps) {
  return (
    <section className="scroll-section py-5 md:py-7">
      <div className="mx-auto max-w-[90rem] px-3 sm:px-4 lg:px-5">
        <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
          <div className="min-w-0">
            <h2 className="text-xl font-light tracking-tight md:text-2xl">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <Link href={href} className="shrink-0">
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              Shop
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}

export function SocialProofBanner({ message, children }: { message: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3 md:p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
        <span className="h-1.5 w-1.5 rounded-full bg-accent max-md:animate-none md:animate-pulse" />
        {message}
      </p>
      {children}
    </div>
  );
}
