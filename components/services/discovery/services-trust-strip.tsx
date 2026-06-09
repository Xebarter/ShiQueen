'use client';

import { BadgeCheck, Car, MessageCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const TRUST_ITEMS = [
  {
    icon: BadgeCheck,
    title: 'Verified providers',
    description: 'Vetted professionals',
  },
  {
    icon: Car,
    title: 'Home visits',
    description: 'Mobile service available',
  },
  {
    icon: MessageCircle,
    title: 'Instant contact',
    description: 'Call or WhatsApp',
  },
  {
    icon: Shield,
    title: 'Secure booking',
    description: 'Request with confidence',
  },
];

export function ServicesTrustStrip() {
  return (
    <section className="border-t border-border/50 bg-muted/30 py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-border/60 bg-card p-4 text-center shadow-sm"
            >
              <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
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
