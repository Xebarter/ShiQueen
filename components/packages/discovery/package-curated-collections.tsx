'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getCollectionsByGroup,
  type PackageCollectionGroup,
} from '@/lib/package-collections';
import { cn } from '@/lib/utils';

interface PackageCuratedCollectionsProps {
  onSelectCollection: (collectionId: string) => void;
}

const GROUPS: { id: PackageCollectionGroup; title: string; subtitle: string }[] = [
  { id: 'occasion', title: 'Occasions', subtitle: 'Gifts and moments, already composed' },
  { id: 'need', title: 'Rituals', subtitle: 'How she lives, dressed as a collection' },
  { id: 'budget', title: 'Investment', subtitle: 'From considered essentials to the full edit' },
];

export function PackageCuratedCollections({
  onSelectCollection,
}: PackageCuratedCollectionsProps) {
  const [group, setGroup] = useState<PackageCollectionGroup>('occasion');
  const collections = useMemo(() => getCollectionsByGroup(group), [group]);
  const meta = GROUPS.find((item) => item.id === group)!;

  return (
    <section className="border-b border-border/40 bg-gradient-to-b from-muted/20 to-background py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Edits</p>
          <h2 className="mt-1 font-[family-name:var(--font-brand)] text-3xl font-medium tracking-tight">
            Shop the story
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{meta.subtitle}</p>
        </motion.div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {GROUPS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGroup(item.id)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
                group === item.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground ring-1 ring-border/70 hover:text-foreground'
              )}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col, index) => (
            <motion.button
              key={col.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onSelectCollection(col.id)}
              className="group flex h-full flex-col rounded-3xl border border-border/60 bg-card p-5 text-left shadow-sm ring-1 ring-black/[0.02] transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg"
            >
              {col.emoji && (
                <span className="mb-3 text-2xl" aria-hidden>
                  {col.emoji}
                </span>
              )}
              <h3 className="font-semibold leading-snug tracking-tight">{col.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{col.subtitle}</p>
              <span className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary transition group-hover:tracking-[0.18em]">
                Open edit
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
