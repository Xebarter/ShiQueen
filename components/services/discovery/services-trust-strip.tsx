'use client';

import { BadgeCheck, CreditCard, MessageCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const TRUST_ITEMS = [
  {
    icon: BadgeCheck,
    title: 'Verified providers',
    description: 'Vetted beauty & wellness pros',
  },
  {
    icon: CreditCard,
    title: 'Pay & book',
    description: 'Secure mobile money upfront',
  },
  {
    icon: MessageCircle,
    title: 'Gift payment',
    description: 'Someone else can cover it',
  },
  {
    icon: Shield,
    title: 'Confirmed slots',
    description: 'Locked in after payment',
  },
];

export function ServicesTrustStrip() {
  return (
    <section className="border-t border-border/50 bg-gradient-to-b from-muted/40 to-background py-12 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-lg">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Why book on ShiQueen
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-brand)] text-2xl font-medium tracking-tight sm:text-3xl">
            A smooth, professional reservation
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5"
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold tracking-tight">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
