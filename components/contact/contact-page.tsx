'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  contactWhatsAppHref,
} from '@/lib/contact-info';
import { cn } from '@/lib/utils';

const WHATSAPP_HREF = contactWhatsAppHref(
  "Hi SheQueen, I'd like to get in touch."
);
const EMAIL = 'hello@shequeen.com';

const TOPICS = [
  { value: 'general', label: 'General inquiry' },
  { value: 'order', label: 'Order support' },
  { value: 'services', label: 'List my services' },
  { value: 'wholesale', label: 'Wholesale & packages' },
  { value: 'other', label: 'Something else' },
];

const CONTACT_CHANNELS = [
  {
    icon: Mail,
    title: 'Email',
    value: EMAIL,
    href: `mailto:${EMAIL}`,
    hint: 'Replies within 24 hours',
  },
  {
    icon: Phone,
    title: 'Phone',
    value: CONTACT_PHONE_DISPLAY,
    href: CONTACT_PHONE_HREF,
    hint: 'Mon–Sat, 9am–6pm EAT',
  },
  {
    icon: MapPin,
    title: 'Location',
    value: 'Kampala, Uganda',
    href: undefined,
    hint: 'Nationwide delivery & services',
  },
];

const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'Once your order ships, you’ll get an email with tracking details. You can also view order status in your account.',
  },
  {
    q: 'Can I list my beauty or wellness service?',
    a: 'Yes — choose “List my services” above or visit our Services page and tap Get listed. Our team will follow up within 2 business days.',
  },
  {
    q: 'Do you offer wholesale or bulk packages?',
    a: 'SheQueen offers curated packages and wholesale pricing. Mention wholesale in your message or explore the Packages and Wholesale sections.',
  },
  {
    q: 'What is your return policy?',
    a: 'Unopened items in original condition can be returned within 30 days. Contact us with your order number to start a return.',
  },
];

const inputClass =
  'h-11 rounded-xl border-border/70 bg-muted/30 transition focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/10';

export function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'general',
    subject: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: '', email: '', topic: 'general', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-muted/25 via-background to-background overflow-x-clip mobile-scroll-optimize">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-background to-accent/10" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.3] [background-image:linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] [background-size:3rem_3rem]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3 w-3" />
              Contact
            </span>
            <h1 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl lg:text-[2.65rem] lg:leading-tight">
              We&apos;re here to <span className="font-semibold text-primary">help</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
              Orders, services, wholesale — reach our team by form, phone, or WhatsApp.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {CONTACT_CHANNELS.map((channel, i) => {
                const Icon = channel.icon;
                const inner = (
                  <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-sm ring-1 ring-black/[0.02] transition hover:border-primary/25 hover:shadow-md">
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {channel.title}
                    </p>
                    <p className="mt-1 font-semibold">{channel.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{channel.hint}</p>
                  </div>
                );
                return channel.href ? (
                  <motion.a
                    key={channel.title}
                    href={channel.href}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="block"
                  >
                    {inner}
                  </motion.a>
                ) : (
                  <motion.div
                    key={channel.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    {inner}
                  </motion.div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">WhatsApp</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fastest way to reach us — usually within an hour during business hours.
                  </p>
                  <a
                    href={WHATSAPP_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
                  >
                    Open WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                Support hours
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex justify-between gap-4">
                  <span>Mon – Fri</span>
                  <span className="font-medium text-foreground">9:00 – 18:00 EAT</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Saturday</span>
                  <span className="font-medium text-foreground">10:00 – 16:00 EAT</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Sunday</span>
                  <span className="font-medium text-foreground">Closed</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Provider listings?{' '}
                <Link href="/services" className="font-medium text-primary hover:underline">
                  Browse services
                </Link>
              </p>
            </div>
          </aside>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-md ring-1 ring-black/[0.02]">
              <div className="border-b border-border/50 bg-muted/30 px-6 py-4 sm:px-8">
                <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Send a message</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Fill in the form and we&apos;ll respond by email.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                      className={inputClass}
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
                      placeholder="you@email.com"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <select
                      id="topic"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      className={cn('flex w-full px-3 text-sm', inputClass)}
                    >
                      {TOPICS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Brief summary"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    rows={6}
                    required
                    className={cn(
                      'w-full resize-none rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm transition placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/10'
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="h-12 w-full rounded-2xl font-semibold shadow-lg shadow-primary/20 sm:w-auto sm:px-10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="mt-16 border-t border-border/50 pt-12 sm:mt-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
                Common <span className="font-semibold text-primary">questions</span>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Quick answers before you write in
              </p>
            </div>
            <Link
              href="/faq"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all FAQs →
            </Link>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={faq.q}
                  className={cn(
                    'overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-black/[0.02] transition',
                    isOpen ? 'border-primary/25 shadow-md' : 'border-border/60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold leading-snug">{faq.q}</span>
                    <span
                      className={cn(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold transition',
                        isOpen && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border/50 px-5 pb-4 pt-3">
                      <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
