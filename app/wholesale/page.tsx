'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useWholesale } from '@/lib/wholesale-context';
import { Building2, Package, TrendingUp, Shield, Clock, BarChart3 } from 'lucide-react';
import { VOLUME_TIER_LABELS, formatUGX } from '@/lib/wholesale-data';

export default function WholesalePage() {
  const { packages } = useWholesale();

  const features = [
    {
      icon: TrendingUp,
      title: 'Volume Discounts',
      description: 'Save up to 30% on bulk orders with tiered pricing',
    },
    {
      icon: Package,
      title: 'Custom Bundles',
      description: 'Create packages tailored to your business needs',
    },
    {
      icon: Shield,
      title: 'Verified Partners',
      description: 'Work with vetted wholesale accounts only',
    },
    {
      icon: Clock,
      title: 'Fast Processing',
      description: 'Quick approvals and expedited shipping available',
    },
    {
      icon: BarChart3,
      title: 'Business Analytics',
      description: 'Track orders, pricing, and insights in real-time',
    },
    {
      icon: Building2,
      title: 'Account Support',
      description: 'Dedicated account managers for bulk orders',
    },
  ];

  return (
    <main>
      <Header />

      {/* Hero Section */}
      <section className="min-h-[600px] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6 text-foreground">
              Premium{' '}
              <span className="text-primary font-semibold">Wholesale Solutions</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Access our complete product catalog at wholesale pricing. Scale your business with flexible payment terms and dedicated support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/wholesale/bulk-orders">
                <Button size="lg" className="gap-2">
                  Start Bulk Order
                </Button>
              </Link>
              <Link href="/wholesale/account">
                <Button size="lg" variant="outline">
                  Apply for Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light tracking-tight mb-12">Why Choose Our Wholesale Program</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="p-6 border border-border rounded-lg hover:bg-secondary/50 transition">
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light tracking-tight mb-12">Volume Pricing Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: VOLUME_TIER_LABELS[0].label, discount: 'Retail', color: 'from-rose-50' },
              { label: VOLUME_TIER_LABELS[1].label, discount: '12%', color: 'from-pink-100' },
              { label: VOLUME_TIER_LABELS[2].label, discount: '18%', color: 'from-fuchsia-100' },
              { label: VOLUME_TIER_LABELS[3].label, discount: '25%', color: 'from-amber-100' },
            ].map((tier) => (
              <div
                key={tier.label}
                className={`bg-gradient-to-br ${tier.color} to-transparent rounded-lg p-8 text-center border border-border`}
              >
                <p className="text-muted-foreground text-sm font-medium mb-2">{tier.label}</p>
                <p className="text-4xl font-light mb-2">{tier.discount}</p>
                <p className="text-sm text-muted-foreground">Discount</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-light tracking-tight">Featured Wholesale Packages</h2>
            <Link href="/wholesale/bundles">
              <Button variant="outline">View All Bundles</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.slice(0, 3).map((pkg) => (
              <Link key={pkg.id} href={`/wholesale/bundles/${pkg.id}`}>
                <div className="border border-border rounded-lg p-6 hover:shadow-lg transition cursor-pointer h-full flex flex-col">
                  <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4 flex-grow">{pkg.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Retail Value</span>
                      <span className="font-semibold line-through">{formatUGX(pkg.basePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Wholesale Price</span>
                      <span className="text-primary font-bold text-lg">
                        {formatUGX(pkg.discountedPrice)}
                      </span>
                    </div>
                    <div className="bg-accent/20 text-accent rounded px-3 py-1 text-sm font-semibold text-center">
                      Save {pkg.savingsPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-light tracking-tight mb-4">Ready to Scale Your Business?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join hundreds of businesses already benefiting from our wholesale program. Get started today.
          </p>
          <Link href="/wholesale/account">
            <Button size="lg" variant="secondary">
              Apply for Wholesale Account
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
