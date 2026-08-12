import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
} from '@/lib/contact-info';
import { LegalTocChips, LegalTocSidebar, type LegalTocItem } from '@/components/legal/legal-toc-nav';
import { cn } from '@/lib/utils';

export type { LegalTocItem };

export const LEGAL_LAST_UPDATED = 'August 12, 2026';
export const LEGAL_LAST_UPDATED_ISO = '2026-08-12';
export const LEGAL_SITE_URL = 'https://shequeen.com';
export const LEGAL_SITE_LABEL = 'shequeen.com';
export const LEGAL_SUPPORT_EMAIL = 'hello@shequeen.com';
export const LEGAL_PRIVACY_EMAIL = 'privacy@shequeen.com';
export const LEGAL_BUSINESS_ADDRESS = 'Kampala, Uganda';
export const LEGAL_RETURN_DAYS = 14;
export const LEGAL_DEFECT_REPORT_DAYS = 7;

function splitSectionTitle(title: string): { number: string | null; label: string } {
  const match = title.match(/^(\d+)\.\s*(.+)$/);
  if (!match) return { number: null, label: title };
  return { number: match[1].padStart(2, '0'), label: match[2] };
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const { number, label } = splitSectionTitle(title);

  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-start gap-3 border-b border-border/55 pb-3.5 sm:gap-4">
        {number ? (
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-[11px] font-semibold tabular-nums text-primary ring-1 ring-primary/15">
            {number}
          </span>
        ) : null}
        <h2 className="min-w-0 pt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-[1.4rem]">
          {label}
        </h2>
      </div>
      <div className="mt-5 space-y-4 text-[15px] leading-[1.7] text-muted-foreground sm:pl-12">
        {children}
      </div>
    </section>
  );
}

export function LegalSubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="pt-2 text-[15px] font-semibold tracking-tight text-foreground">
      {children}
    </h3>
  );
}

export function LegalBulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span
            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/65 ring-4 ring-primary/10"
            aria-hidden
          />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalCallout({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode;
  tone?: 'muted' | 'primary' | 'warning';
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-4 text-sm leading-relaxed sm:px-5',
        tone === 'muted' && 'border-border/60 bg-muted/30 text-muted-foreground',
        tone === 'primary' &&
          'border-primary/20 bg-gradient-to-br from-primary/[0.07] to-transparent text-foreground/90',
        tone === 'warning' &&
          'border-amber-500/25 bg-gradient-to-br from-amber-500/[0.09] to-transparent text-foreground/90'
      )}
    >
      {children}
    </div>
  );
}

export function LegalContactCards({
  email = LEGAL_SUPPORT_EMAIL,
}: {
  email?: string;
}) {
  const cards = [
    {
      href: `mailto:${email}`,
      icon: Mail,
      label: 'Email',
      value: email,
      interactive: true,
    },
    {
      href: CONTACT_PHONE_HREF,
      icon: Phone,
      label: 'Phone',
      value: CONTACT_PHONE_DISPLAY,
      interactive: true,
    },
    {
      href: undefined,
      icon: MapPin,
      label: 'Address',
      value: LEGAL_BUSINESS_ADDRESS,
      interactive: false,
    },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map(({ href, icon: Icon, label, value, interactive }) => {
        const className = cn(
          'flex items-start gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-muted/35 to-transparent px-4 py-4',
          interactive &&
            'transition hover:border-primary/30 hover:from-primary/[0.06] hover:shadow-sm'
        );

        const content = (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </span>
              <span className="mt-1 block text-sm font-medium leading-snug text-foreground">
                {value}
              </span>
            </span>
          </>
        );

        if (href) {
          return (
            <a key={label} href={href} className={className}>
              {content}
            </a>
          );
        }

        return (
          <div key={label} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function LegalRelatedLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground/85 shadow-sm transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
    >
      {children}
      <ArrowUpRight className="h-3 w-3 opacity-50" />
    </Link>
  );
}

export function LegalPageShell({
  badge,
  badgeIcon: BadgeIcon,
  title,
  summary,
  relatedLinks,
  toc,
  tocLabel = 'On this page',
  children,
}: {
  badge: string;
  badgeIcon: LucideIcon;
  title: string;
  summary: React.ReactNode;
  relatedLinks?: React.ReactNode;
  toc: readonly LegalTocItem[];
  tocLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative pb-16 pt-6 sm:pb-20 sm:pt-8 lg:pb-24 lg:pt-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,oklch(0.40_0.13_340_/_0.08),transparent_65%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.02]">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,oklch(0.40_0.13_340_/_0.12),transparent),radial-gradient(ellipse_60%_50%_at_0%_100%,oklch(0.74_0.12_62_/_0.10),transparent)]"
            aria-hidden
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            aria-hidden
          />
          <div
            className="absolute bottom-0 right-0 h-40 w-40 translate-x-1/4 translate-y-1/4 rounded-full bg-primary/[0.04] blur-2xl"
            aria-hidden
          />

          <div className="relative px-6 py-9 sm:px-10 sm:py-11 lg:px-12 lg:py-12">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary shadow-sm backdrop-blur-sm">
                  <BadgeIcon className="h-3.5 w-3.5" />
                  {badge}
                </span>
                <span className="inline-flex items-center rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
                  Uganda · Effective{' '}
                  <time dateTime={LEGAL_LAST_UPDATED_ISO} className="ml-1 text-foreground">
                    {LEGAL_LAST_UPDATED}
                  </time>
                </span>
              </div>

              <h1 className="mt-5 font-brand text-[2rem] font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.9rem] lg:leading-[1.08]">
                {title}
              </h1>

              <div className="mt-5 max-w-2xl space-y-3 text-[15px] leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
                {summary}
              </div>

              {relatedLinks ? (
                <div className="mt-7 flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Related
                  </span>
                  {relatedLinks}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <LegalTocSidebar title={title} toc={toc} tocLabel={tocLabel} />
          </aside>

          <div className="min-w-0 space-y-6">
            <div className="lg:hidden">
              <LegalTocChips title={title} toc={toc} />
            </div>

            <article className="divide-y divide-border/50 overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm ring-1 ring-black/[0.02] [&>*]:px-5 [&>*]:py-8 sm:[&>*]:px-8 sm:[&>*]:py-9 lg:[&>*]:px-10">
              {children}
            </article>

            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.05] via-card to-card px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-sm font-semibold tracking-tight text-foreground">
                  Questions about this policy?
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Our team in Kampala is happy to help.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
