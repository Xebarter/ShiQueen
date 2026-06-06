import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Gift, Zap, Trophy, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Loyalty() {
  const tiers = [
    {
      name: 'Bronze',
      minSpend: '$0',
      benefits: [
        '5% off all purchases',
        'Early access to sales',
        'Birthday bonus',
        'Free shipping on orders over $100',
      ],
      color: 'from-rose-100 to-rose-50',
      icon: Heart,
    },
    {
      name: 'Silver',
      minSpend: '$500+',
      benefits: [
        '10% off all purchases',
        'Early access to sales (48 hours)',
        'Birthday bonus + $20 credit',
        'Free shipping on all orders',
        'Priority customer service',
      ],
      color: 'from-fuchsia-100 to-rose-50',
      icon: Zap,
      featured: true,
    },
    {
      name: 'Gold',
      minSpend: '$1,500+',
      benefits: [
        '15% off all purchases',
        'Early access to sales (72 hours)',
        'Birthday bonus + $50 credit',
        'Free expedited shipping',
        '24/7 VIP customer service',
        'Exclusive member-only collections',
      ],
      color: 'from-amber-50 to-yellow-100',
      icon: Trophy,
    },
  ];

  const rewards = [
    {
      icon: Gift,
      title: 'Earn Points',
      description: 'Earn 1 point for every $1 spent on purchases',
    },
    {
      icon: Zap,
      title: 'Redeem Rewards',
      description: 'Redeem points for discounts, free items, and exclusive access',
    },
    {
      icon: Heart,
      title: 'Exclusive Benefits',
      description: 'Unlock tier-based rewards as you spend more',
    },
  ];

  return (
    <main>
      <Header />

      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-light tracking-tight mb-6">SheQueen Rewards</h1>
          <p className="text-xl text-muted-foreground">
            Earn points with every purchase and unlock exclusive rewards, early access to collections, and VIP perks.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rewards.map((reward) => {
              const Icon = reward.icon;
              return (
                <div key={reward.title} className="text-center">
                  <div className="flex justify-center mb-4">
                    <Icon className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{reward.title}</h3>
                  <p className="text-muted-foreground">{reward.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="py-20 bg-secondary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light mb-12">Membership Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={`rounded-lg p-8 border ${
                    tier.featured
                      ? 'border-primary bg-background ring-2 ring-primary'
                      : 'border-border'
                  }`}
                >
                  {tier.featured && (
                    <div className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold mb-4">
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-semibold">{tier.name}</h3>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Annual spend: {tier.minSpend}
                  </p>

                  <div className="space-y-3 mb-8">
                    {tier.benefits.map((benefit) => (
                      <div key={benefit} className="flex gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={tier.featured ? 'default' : 'outline'}
                  >
                    Learn More
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light mb-12">FAQ</h2>
          <div className="space-y-6">
            {[
              {
                q: 'How do I join SheQueen Rewards?',
                a: 'Membership is free! Simply create an account during checkout or visit your account settings to join the program.',
              },
              {
                q: 'When do points expire?',
                a: 'Points never expire as long as your account remains active. We define active as at least one purchase or login per year.',
              },
              {
                q: 'Can I transfer points to another person?',
                a: 'Points are personal to your account and cannot be transferred. However, you can use them to make purchases as gifts.',
              },
              {
                q: 'How long does it take to earn rewards?',
                a: 'Points are credited immediately upon purchase. You can redeem them right away to discount future purchases.',
              },
            ].map((faq, i) => (
              <div key={i} className="border border-border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-light tracking-tight mb-4">
            Start Earning Rewards
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of SheQueen members and enjoy exclusive benefits today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary">
                Join Now
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
