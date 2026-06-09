'use client';

import { motion } from 'framer-motion';
import {
  getCollectionsByGroup,
  type PackageCollectionGroup,
} from '@/lib/package-collections';
import { ProductCarousel, CarouselItem } from '@/components/home/product-sections';

interface PackageCuratedCollectionsProps {
  onSelectCollection: (collectionId: string) => void;
}

const GROUP_LABELS: Record<PackageCollectionGroup, { title: string; subtitle: string }> = {
  need: {
    title: 'Shop by need',
    subtitle: 'Complete solutions for how you live',
  },
  occasion: {
    title: 'Shop by occasion',
    subtitle: 'Perfect bundles for life\'s moments',
  },
  budget: {
    title: 'Shop by budget',
    subtitle: 'Find your ideal value',
  },
};

export function PackageCuratedCollections({
  onSelectCollection,
}: PackageCuratedCollectionsProps) {
  const groups: PackageCollectionGroup[] = ['need', 'occasion', 'budget'];

  return (
    <>
      {groups.map((group) => {
        const collections = getCollectionsByGroup(group);
        const meta = GROUP_LABELS[group];

        return (
          <section key={group} className="border-b border-border/30 py-10 md:py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                <h2 className="text-2xl font-light tracking-tight sm:text-3xl">{meta.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{meta.subtitle}</p>
              </motion.div>

              <ProductCarousel>
                {collections.map((col) => (
                  <CarouselItem key={col.id} className="w-[min(80vw,16rem)]">
                    <button
                      type="button"
                      onClick={() => onSelectCollection(col.id)}
                      className="flex h-full w-full flex-col rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                    >
                      {col.emoji && (
                        <span className="mb-3 text-2xl" aria-hidden>
                          {col.emoji}
                        </span>
                      )}
                      <h3 className="font-semibold leading-snug">{col.title}</h3>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground">{col.subtitle}</p>
                      <span className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
                        Explore collection
                      </span>
                    </button>
                  </CarouselItem>
                ))}
              </ProductCarousel>
            </div>
          </section>
        );
      })}
    </>
  );
}
