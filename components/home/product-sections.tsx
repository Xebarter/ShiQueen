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
  const headerProps = lightScroll
    ? { className: 'flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8' }
    : {
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        className: 'flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8',
      };

  return (
    <section className={`scroll-section py-10 md:py-14 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header {...headerProps}>
          <div>
            {urgency && (
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-accent mb-2">
                {urgency}
              </span>
            )}
            <h2 className="text-2xl md:text-3xl font-light tracking-tight">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-1 text-sm md:text-base">{subtitle}</p>}
          </div>
          {href && (
            <Link href={href}>
              <Button variant="ghost" className="gap-2 text-primary shrink-0">
                {linkLabel}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </Header>
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

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

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
        className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-x pb-2 -mx-1 px-1"
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
      className={`snap-start shrink-0 w-[160px] sm:w-[200px] md:w-[220px] lg:w-[240px] ${className}`}
    >
      {children}
    </div>
  );
}

interface CategoryShowcaseProps {
  title: string;
  subtitle: string;
  href: string;
  gradient: string;
  children: ReactNode;
}

export function CategoryShowcase({
  title,
  subtitle,
  href,
  gradient,
  children,
}: CategoryShowcaseProps) {
  const lightScroll = useLightScroll();
  const Banner = lightScroll ? 'div' : motion.div;
  const bannerProps = lightScroll
    ? { className: `relative overflow-hidden rounded-3xl ${gradient} p-6 md:p-10 mb-6 md:mb-8` }
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        className: `relative overflow-hidden rounded-3xl ${gradient} p-6 md:p-10 mb-6 md:mb-8`,
      };

  return (
    <section className="scroll-section py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Banner {...bannerProps}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-4xl font-light tracking-tight text-foreground">{title}</h2>
              <p className="text-muted-foreground mt-2 max-w-md">{subtitle}</p>
            </div>
            <Link href={href}>
              <Button size="lg" className="gap-2 shadow-lg">
                Shop Collection
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Banner>
        {children}
      </div>
    </section>
  );
}

export function SocialProofBanner({ message, children }: { message: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 max-md:backdrop-blur-none md:bg-card/50 md:backdrop-blur-sm p-4 md:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent max-md:animate-none md:animate-pulse" />
        {message}
      </p>
      {children}
    </div>
  );
}
