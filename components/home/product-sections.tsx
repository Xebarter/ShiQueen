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
    ? { className: 'flex items-center justify-between gap-3 mb-4 md:mb-5' }
    : {
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        className: 'flex items-center justify-between gap-3 mb-4 md:mb-5',
      };

  return (
    <section className={`scroll-section py-7 md:py-10 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <Header {...headerProps}>
            <div className="flex min-w-0 items-center gap-2">
              {urgency && (
                <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
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
          <p className="-mt-2 mb-4 text-sm text-muted-foreground md:mb-5">{subtitle}</p>
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
    return <div className="grid grid-cols-2 gap-4 pb-2">{children}</div>;
  }

  return (
    <div className="relative group/carousel">
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-0 top-1/3 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 items-center justify-center rounded-full bg-background/90 backdrop-blur border border-border shadow-lg opacity-0 group-hover/carousel:opacity-100 transition"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-0 top-1/3 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 items-center justify-center rounded-full bg-background/90 backdrop-blur border border-border shadow-lg opacity-0 group-hover/carousel:opacity-100 transition"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-1 px-1"
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
      className={`min-w-0 w-full md:snap-start md:shrink-0 md:w-[220px] lg:w-[240px] ${className}`}
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
    <section className="scroll-section py-7 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3 md:mb-5">
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
    <div className="rounded-2xl border border-border/60 bg-card/50 p-3 md:p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
        <span className="h-1.5 w-1.5 rounded-full bg-accent max-md:animate-none md:animate-pulse" />
        {message}
      </p>
      {children}
    </div>
  );
}
