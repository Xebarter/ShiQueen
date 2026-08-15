'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  HelpCircle,
  Mail,
  MessageCircle,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button, buttonVariants } from '@/components/ui/button';
import { contactWhatsAppHref } from '@/lib/contact-info';
import {
  FAQ_CATEGORIES,
  faqAnswerPlainText,
  type FaqAnswerBlock,
  type FaqCategory,
  type FaqItem,
} from '@/lib/faq-content';
import { cn } from '@/lib/utils';

const WHATSAPP_HREF = contactWhatsAppHref(
  'Hi ShiQueen, I have a question from the FAQ page.'
);

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function FaqAnswer({ blocks }: { blocks: FaqAnswerBlock[] }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
      {blocks.map((block, index) => {
        if (block.type === 'p') {
          return <p key={index}>{renderInlineBold(block.text)}</p>;
        }
        if (block.type === 'ul') {
          return (
            <ul key={index} className="space-y-2 pl-1">
              {block.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70"
                    aria-hidden
                  />
                  <span>{renderInlineBold(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={index} className="space-y-2 pl-1">
              {block.items.map((item, itemIndex) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[11px] font-semibold text-primary">
                    {itemIndex + 1}
                  </span>
                  <span>{renderInlineBold(item)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <dl key={index} className="space-y-2.5">
            {block.items.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-3"
              >
                <dt className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm text-muted-foreground">{item.text}</dd>
              </div>
            ))}
          </dl>
        );
      })}
    </div>
  );
}

function FaqAccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-card/80 transition',
        open ? 'border-primary/25 shadow-sm' : 'border-border/60'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5"
        aria-expanded={open}
      >
        <span className="font-semibold leading-snug text-foreground">{item.q}</span>
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition',
            open ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
          aria-hidden
        >
          {open ? '−' : '+'}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-4 pb-4 pt-3 sm:px-5">
              <FaqAnswer blocks={item.blocks} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function matchesQuery(item: FaqItem, query: string) {
  if (!query) return true;
  const haystack = `${item.q} ${faqAnswerPlainText(item.blocks)}`.toLowerCase();
  return haystack.includes(query);
}

export function FaqPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    return FAQ_CATEGORIES.map((category) => ({
      ...category,
      items: category.items.filter((item) => matchesQuery(item, normalizedQuery)),
    })).filter((category) => {
      if (category.items.length === 0) return false;
      if (activeCategory === 'all') return true;
      return category.id === activeCategory;
    });
  }, [activeCategory, normalizedQuery]);

  const totalMatches = useMemo(
    () => filteredCategories.reduce((sum, category) => sum + category.items.length, 0),
    [filteredCategories]
  );

  useEffect(() => {
    if (!normalizedQuery) return;
    const first = filteredCategories[0]?.items[0];
    if (first) setOpenId(first.id);
  }, [normalizedQuery, filteredCategories]);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId === activeCategory ? 'all' : categoryId);
    if (categoryId !== 'all') {
      requestAnimationFrame(() => {
        document.getElementById(`faq-${categoryId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  };

  return (
    <main>
      <Header />

      <section className="relative overflow-hidden border-b border-border/50">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.18),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] [background-size:48px_48px]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              ShiQueen Help Centre
            </p>
            <h1 className="font-[family-name:var(--font-brand)] text-4xl font-medium tracking-tight text-foreground sm:text-5xl md:text-[3.25rem]">
              Frequently asked questions
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Answers about shopping, delivery, payments, returns, and beauty products —
              so you can order with confidence.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="relative mt-8 max-w-xl"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveCategory('all');
              }}
              placeholder="Search questions — delivery, returns, payments…"
              className="w-full rounded-2xl border border-border/70 bg-background/90 py-3.5 pl-11 pr-4 text-base shadow-sm backdrop-blur-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 sm:text-sm"
              aria-label="Search FAQs"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14 }}
            className="mt-6 flex flex-wrap gap-2"
          >
            <CategoryChip
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
              label="All topics"
            />
            {FAQ_CATEGORIES.map((category) => (
              <CategoryChip
                key={category.id}
                active={activeCategory === category.id}
                onClick={() => scrollToCategory(category.id)}
                label={category.title}
              />
            ))}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {totalMatches} question{totalMatches === 1 ? '' : 's'}
              {normalizedQuery ? ` matching “${query.trim()}”` : ''}
              {activeCategory !== 'all'
                ? ` in ${FAQ_CATEGORIES.find((c) => c.id === activeCategory)?.title ?? 'this topic'}`
                : ''}
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Still need help?
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground/70" />
            <p className="mt-4 text-lg font-semibold">No matching questions</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different search, or contact support with your order number.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button type="button" variant="outline" onClick={() => setQuery('')}>
                Clear search
              </Button>
              <Link href="/contact" className={cn(buttonVariants(), 'gap-2')}>
                Contact support
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredCategories.map((category, categoryIndex) => (
              <CategorySection
                key={category.id}
                category={category}
                openId={openId}
                onToggle={(id) => setOpenId((current) => (current === id ? null : id))}
                index={categoryIndex}
              />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-border/60 bg-gradient-to-br from-primary/[0.06] via-background to-accent/10">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Still have questions?
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-brand)] text-3xl font-medium tracking-tight sm:text-4xl">
              We&apos;re here to help
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              If you cannot find the answer here, contact the ShiQueen Customer Support Team.
              For faster help with an existing order, always include your{' '}
              <strong className="font-semibold text-foreground">order number</strong>.
            </p>
            <p className="mt-5 text-sm font-medium text-foreground/80">
              ShiQueen — Fashion, Beauty &amp; More, Made for Her.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3">
            <Link
              href="/contact"
              className={cn(buttonVariants({ size: 'lg' }), 'justify-start gap-2')}
            >
              <Mail className="h-4 w-4" />
              Contact support
            </Link>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'justify-start gap-2'
              )}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp us
            </a>
            <Link
              href="/refunds"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'lg' }),
                'justify-start gap-2 text-muted-foreground'
              )}
            >
              <ShieldAlert className="h-4 w-4" />
              Read refund policy
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-xs font-medium transition sm:text-sm',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'border border-border/70 bg-background/70 text-muted-foreground hover:border-primary/30 hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

function CategorySection({
  category,
  openId,
  onToggle,
  index,
}: {
  category: FaqCategory;
  openId: string | null;
  onToggle: (id: string) => void;
  index: number;
}) {
  return (
    <motion.section
      id={`faq-${category.id}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.2) }}
      className="scroll-mt-28"
    >
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{category.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
        </div>
        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground">
          {category.items.length}
        </span>
      </div>
      <div className="space-y-3">
        {category.items.map((item) => (
          <FaqAccordionItem
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>
    </motion.section>
  );
}
