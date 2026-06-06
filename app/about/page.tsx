import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';

export default function About() {
  const values = [
    {
      title: 'Quality',
      description: 'Every item is carefully selected to meet our high standards',
    },
    {
      title: 'Authenticity',
      description: 'We celebrate genuine, unique styles and perspectives',
    },
    {
      title: 'Sustainability',
      description: 'We partner with ethical brands and support conscious choices',
    },
    {
      title: 'Community',
      description: 'We build a supportive space for women to express themselves',
    },
  ];

  return (
    <main>
      <Header />

      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-light tracking-tight mb-6">About SheQueen</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We believe that every woman deserves to feel confident, beautiful, and empowered through thoughtfully curated fashion and lifestyle products.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light mb-8">Our Story</h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              SheQueen was founded on a simple belief: that shopping for quality products should be an enjoyable and inspiring experience. In a world of endless options, we wanted to create a curated space where women could discover items that truly resonated with them.
            </p>
            <p>
              What started as a personal passion project has grown into a thriving community of women who share our values of quality, authenticity, and self-expression. Every collection we create is designed with intention and care, featuring both emerging designers and established brands.
            </p>
            <p>
              Today, SheQueen is more than just an e-commerce platform—it&apos;s a lifestyle destination for women seeking to elevate their everyday and create moments that matter.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
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

      {/* Team */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light mb-12">Meet the Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((member) => (
              <div key={member} className="text-center">
                <div className="w-32 h-32 mx-auto bg-secondary rounded-full flex items-center justify-center text-4xl mb-4">
                  👩
                </div>
                <h3 className="text-lg font-semibold mb-1">Team Member {member}</h3>
                <p className="text-muted-foreground text-sm">Role & Title</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-light mb-4">Join Our Community</h2>
          <p className="text-lg mb-8 opacity-90">
            Become part of something special. Discover, explore, and express yourself with SheQueen.
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
