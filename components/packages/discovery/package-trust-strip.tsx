'use client';

import { Shield, Truck, Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const TRUST_ITEMS = [
  {
    icon: Sparkles,
    title: 'Composed, not compiled',
    description: 'Each bundle is edited as a complete ritual',
  },
  {
    icon: Truck,
    title: 'Complimentary delivery',
    description: 'Free on orders over UGX 500,000',
  },
  {
    icon: Shield,
    title: 'Thoughtful returns',
    description: '30 days, no theatre',
  },
  {
    icon: Heart,
    title: 'Bundle advantage',
    description: 'More considered than buying piece by piece',
  },
];

export function PackageTrustStrip() {
  return (
    <section className="border-t border-border/40 bg-gradient-to-b from-primary/[0.04] to-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="text-center md:text-left"
            >
              <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary md:mx-0">
                <item.icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold tracking-tight">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
