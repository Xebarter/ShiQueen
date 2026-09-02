import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { PAGE_SEO } from '@/lib/seo/site';
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { getFeatureFlags } from '@/lib/supabase/feature-flags-server';

export const metadata = PAGE_SEO.about;

export default async function About() {
  const flags = await getFeatureFlags();

  const values = [
    {
      title: 'Quality',
      description: 'Every dress, beauty product, and package is selected to meet a high standard for women shopping in Uganda.',
    },
    {
      title: 'Authenticity',
      description: 'We celebrate genuine style — from everyday ladies fashion to bridal makeup and salon bookings in Kampala.',
    },
    {
      title: 'Care',
      description: 'Nationwide delivery, considered packages, and trusted beauty services so shopping feels simple and personal.',
    },
    {
      title: 'Community',
      description: 'ShiQueen is a space for women to shop, book, and feel confident — whether you are returning or discovering us for the first time.',
    },
  ];

  const offers = [
    {
      title: 'Fashion & beauty shop',
      description: 'Women\'s clothes, dresses, makeup, skincare, handbags, and accessories — online from Kampala.',
      href: '/shop',
      label: 'Shop now',
    },
    ...(flags.packages
      ? [
          {
            title: 'Packages',
            description:
              'Curated beauty packages and product-plus-service bundles with real savings versus buying separately.',
            href: '/packages',
            label: 'View packages',
          },
        ]
      : []),
    ...(flags.services
      ? [
          {
            title: 'Beauty bookings',
            description:
              'Book makeup artists, hair salon, nails, bridal makeup, and styling across Kampala.',
            href: '/services',
            label: 'Book a service',
          },
        ]
      : []),
  ];

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />
      <Header />

      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Kampala · Uganda
          </p>
          <h1 className="text-5xl font-light tracking-tight mb-6">About ShiQueen</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            ShiQueen is a women&apos;s online shop and booking platform in Kampala. Shop fashion,
            beauty, and wellness products, buy curated packages, and book trusted lifestyle
            services — with delivery across Uganda.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light mb-8">Our story</h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              We built ShiQueen so shopping for quality pieces in Uganda would feel curated,
              not overwhelming. From ladies dresses and handbags to makeup, skincare, and
              salon appointments, everything lives in one place.
            </p>
            <p>
              Today ShiQueen is more than a boutique: it is a lifestyle destination for women
              who want to shop online, save with packages, and book beauty services with
              confidence.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value) => (
              <div key={value.title} className="space-y-3">
                <h3 className="text-2xl font-semibold">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light mb-12">What you can do here</h2>
          <div className={`grid grid-cols-1 gap-8 ${offers.length > 1 ? 'md:grid-cols-3' : ''}`}>
            {offers.map((offer) => (
              <div key={offer.title} className="rounded-2xl border border-border/60 bg-card p-6">
                <h3 className="text-lg font-semibold mb-2">{offer.title}</h3>
                <p className="text-muted-foreground text-sm mb-5">{offer.description}</p>
                <Link href={offer.href} className="text-sm font-medium text-primary hover:underline">
                  {offer.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-light mb-4">Shop ShiQueen</h2>
          <p className="text-lg mb-8 opacity-90">
            Women&apos;s fashion, beauty, packages, and bookings — from Kampala to the rest of Uganda.
          </p>
          <Link href="/shop">
            <Button size="lg" variant="secondary">
              Start Shopping
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
