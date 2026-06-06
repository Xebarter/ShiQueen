'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Loader2, Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Message sent! We&apos;ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'hello@shequeen.com',
      href: 'mailto:hello@shequeen.com',
    },
    {
      icon: Phone,
      title: 'Phone',
      value: '+1 (234) 567-890',
      href: 'tel:+1234567890',
    },
    {
      icon: MapPin,
      title: 'Address',
      value: 'New York, NY 10001, USA',
      href: '#',
    },
  ];

  return (
    <main>
      <Header />

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h1 className="text-5xl font-light tracking-tight mb-4">Get in Touch</h1>
            <p className="text-lg text-muted-foreground">
              Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {contactInfo.map((info) => {
              const Icon = info.icon;
              return (
                <a
                  key={info.title}
                  href={info.href}
                  className="group"
                >
                  <div className="border border-border rounded-lg p-6 hover:bg-secondary transition h-full">
                    <Icon className="w-8 h-8 text-primary mb-4 group-hover:text-accent transition" />
                    <h3 className="font-semibold text-lg mb-2">{info.title}</h3>
                    <p className="text-muted-foreground group-hover:text-foreground transition">
                      {info.value}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-secondary rounded-lg p-8">
              <h2 className="text-2xl font-light mb-8">Send us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What is this about?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more..."
                    rows={6}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  size="lg"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 pt-20 border-t border-border">
            <h2 className="text-3xl font-light mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'What is your return policy?',
                  a: 'We offer a 30-day return policy for all items in original condition with tags attached.',
                },
                {
                  q: 'How long does shipping take?',
                  a: 'Standard shipping takes 3-5 business days. Express shipping options are available at checkout.',
                },
                {
                  q: 'Do you offer international shipping?',
                  a: 'Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location.',
                },
                {
                  q: 'How do I track my order?',
                  a: 'You&apos;ll receive a tracking number via email once your order ships. You can use it to track your package.',
                },
              ].map((faq, i) => (
                <div key={i} className="border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
