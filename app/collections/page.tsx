import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export default function Collections() {
  const collections = [
    {
      id: 1,
      name: 'Spring Essentials',
      description: 'Fresh, vibrant pieces perfect for the new season',
      gradient: 'from-rose-100 to-pink-100',
      image: '🌸',
      productCount: 24,
    },
    {
      id: 2,
      name: 'Wellness Collection',
      description: 'Self-care products for mind, body, and soul',
      gradient: 'from-fuchsia-100 to-rose-100',
      image: '🧘',
      productCount: 18,
    },
    {
      id: 3,
      name: 'Luxury Basics',
      description: 'Timeless wardrobe staples in premium fabrics',
      gradient: 'from-stone-100 to-rose-50',
      image: '✨',
      productCount: 32,
    },
    {
      id: 4,
      name: 'Evening Wear',
      description: 'Sophisticated pieces for special occasions',
      gradient: 'from-purple-100 to-fuchsia-100',
      image: '💃',
      productCount: 14,
    },
    {
      id: 5,
      name: 'Accessories Edit',
      description: 'Elevate your look with curated accessories',
      gradient: 'from-rose-100 to-pink-100',
      image: '👜',
      productCount: 28,
    },
    {
      id: 6,
      name: 'Travel Capsule',
      description: 'Versatile pieces for the modern traveler',
      gradient: 'from-amber-50 to-rose-100',
      image: '✈️',
      productCount: 16,
    },
  ];

  return (
    <main>
      <Header />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h1 className="text-5xl font-light tracking-tight mb-4">Collections</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Explore our thoughtfully curated collections, each designed to help you express your unique style and discover pieces you&apos;ll love.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="group"
              >
                <div className="space-y-4">
                  {/* Image */}
                  <div
                    className={`bg-gradient-to-br ${collection.gradient} rounded-lg h-64 flex items-center justify-center text-6xl group-hover:shadow-lg transition-shadow`}
                  >
                    {collection.image}
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-2 group-hover:text-primary transition">
                      {collection.name}
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      {collection.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {collection.productCount} items
                      </span>
                      <span
                        className={cn(
                          buttonVariants({ size: 'sm', variant: 'ghost' }),
                          'gap-1',
                        )}
                      >
                        Explore
                        <ArrowRight className="w-4 h-4" />
                      </span>
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
          <h2 className="text-4xl font-light tracking-tight mb-4">
            Still exploring?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Visit our full shop or contact our style experts for personalized recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className={buttonVariants({ size: 'lg', variant: 'secondary' })}
            >
              Browse All Items
            </Link>
            <Link
              href="/contact"
              className={buttonVariants({ size: 'lg', variant: 'outline' })}
            >
              Get Style Advice
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
