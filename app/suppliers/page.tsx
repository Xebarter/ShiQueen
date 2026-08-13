'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowRight, Boxes, Check, Package, ShieldCheck, Sparkles } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const BENEFITS = [
  {
    icon: Package,
    title: 'List your products',
    description: 'Upload inventory with photos, pricing, and stock levels.',
  },
  {
    icon: Boxes,
    title: 'Build packages',
    description: 'Create wholesale-ready bundles from your catalog.',
  },
  {
    icon: ShieldCheck,
    title: 'Curated marketplace',
    description: 'ShiQueen reviews every supplier before products go live.',
  },
];

export default function SupplierLandingPage() {
  const { user, isSupplier, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && isSupplier) {
      router.replace('/suppliers/orders');
    }
  }, [loading, user, isSupplier, router]);

  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F7F1E8] via-background to-[#EAF3F0]" />
          <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/20">
              <Sparkles className="h-3 w-3" />
              Supplier portal
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Sell with ShiQueen
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Create a supplier account, wait for admin approval, then list products and packages
              for customers across Uganda.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/suppliers/sign-up"
                className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
              >
                Become a supplier
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/suppliers/sign-in"
                className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
              >
                Supplier sign in
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
                >
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="text-base font-semibold">{item.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-border/70 bg-muted/30 p-6 sm:p-8">
            <h2 className="text-lg font-semibold">How approval works</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                'Create your supplier account with company and contact details.',
                'Our team reviews your application.',
                'Once approved, you can list products and packages on the storefront.',
              ].map((step) => (
                <li key={step} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
            <Link href="/suppliers/sign-up" className={cn(buttonVariants(), 'mt-6 inline-flex')}>
              Get started
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
