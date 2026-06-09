'use client';

import { Shield, Truck, Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const TRUST_ITEMS = [
  {
    icon: Sparkles,
    title: 'Expertly curated',
    description: 'Complete solutions — not random product picks',
  },
  {
    icon: Truck,
    title: 'Free shipping',
    description: 'On orders over USh 500,000',
  },
  {
    icon: Shield,
    title: '30-day returns',
    description: 'Shop with confidence',
  },
  {
    icon: Heart,
    title: 'Bundle savings',
    description: 'More value than buying separately',
  },
];

export function PackageTrustStrip() {
  return (
    <section className="border-t border-border/40 bg-primary/[0.03] py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="text-center"
            >
              <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
