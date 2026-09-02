'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureFlags } from '@/lib/feature-flags-context';

export function CatalogBottomCta() {
  const { flags } = useFeatureFlags();
  if (!flags.packages && !flags.wholesale) return null;

  return (
    <section className="border-t border-border bg-secondary/30 py-8 md:py-10">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-3 sm:flex-row sm:px-4 lg:px-5">
        {flags.packages ? (
          <Link href="/packages" className="flex-1">
            <Button size="lg" variant="default" className="w-full gap-2">
              Bundles
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : null}
        {flags.wholesale ? (
          <Link href="/wholesale" className="flex-1">
            <Button size="lg" variant="outline" className="w-full gap-2">
              Wholesale
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
