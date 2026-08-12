'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type LegalTocItem = {
  id: string;
  label: string;
};

function useActiveSectionId(toc: readonly LegalTocItem[]) {
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? '');

  useEffect(() => {
    const sections = toc
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-20% 0px -65% 0px',
        threshold: [0, 0.25, 0.5, 1],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [toc]);

  return activeId;
}

export function LegalTocChips({
  title,
  toc,
}: {
  title: string;
  toc: readonly LegalTocItem[];
}) {
  const activeId = useActiveSectionId(toc);

  return (
    <nav
      aria-label={`${title} sections`}
      className="-mx-1 overflow-x-auto px-1 pb-1"
    >
      <div className="flex min-w-max gap-2">
        {toc.map((item) => {
          const active = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                active
                  ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm'
                  : 'border-border/70 bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground'
              )}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export function LegalTocSidebar({
  title,
  toc,
  tocLabel = 'On this page',
}: {
  title: string;
  toc: readonly LegalTocItem[];
  tocLabel?: string;
}) {
  const activeId = useActiveSectionId(toc);

  return (
    <nav
      aria-label={`${title} sections`}
      className="sticky top-28 overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-sm ring-1 ring-black/[0.02] backdrop-blur-md"
    >
      <div className="border-b border-border/50 bg-gradient-to-r from-primary/[0.06] to-transparent px-4 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {tocLabel}
        </p>
        <p className="mt-1 text-sm font-medium tracking-tight text-foreground">
          Jump to a section
        </p>
      </div>
      <ol className="max-h-[calc(100vh-11rem)] space-y-0.5 overflow-y-auto p-2">
        {toc.map((item, index) => {
          const active = activeId === item.id;
          const number = String(index + 1).padStart(2, '0');
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  'group flex items-start gap-2.5 rounded-xl px-2.5 py-2 text-[13px] leading-snug transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 font-mono text-[10px] tabular-nums tracking-wider',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground/55 group-hover:text-muted-foreground'
                  )}
                >
                  {number}
                </span>
                <span className="min-w-0">{item.label.replace(/^\d+\.\s*/, '')}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
