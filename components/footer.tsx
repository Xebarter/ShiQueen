import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { BrandLogo } from './brand-logo';
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  contactWhatsAppHref,
} from '@/lib/contact-info';
import { cn } from '@/lib/utils';

const WHATSAPP_HREF = contactWhatsAppHref();

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5A4.25 4.25 0 0016.25 3.5h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm5.75-2.25a1 1 0 110 2 1 1 0 010-2z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M13.5 3.5H16V0h-2.5C9.91 0 7.5 2.41 7.5 5.5V8H5v3.5h2.5V24h3.5v-12.5H16L16.5 8H11V6c0-.83.67-1.5 1.5-1.5z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: InstagramIcon,
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    icon: FacebookIcon,
  },
] as const;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <BrandLogo variant="footer" className="mb-4" />
            <p className="text-sm text-muted-foreground">
              Products, packages, and trusted services for the modern woman.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/60 text-foreground/75 transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="hover:text-foreground transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-foreground transition">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/shop?new=true" className="hover:text-foreground transition">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/wholesale" className="hover:text-foreground transition">
                  Wholesale
                </Link>
              </li>
              <li>
                <Link href="/suppliers" className="hover:text-foreground transition">
                  Sell with us
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="hover:text-foreground transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-foreground transition">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-foreground transition">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <a href="mailto:hello@shequeen.com" className="hover:text-foreground transition">
                  hello@shequeen.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <a href={CONTACT_PHONE_HREF} className="hover:text-foreground transition">
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Kampala, Uganda</span>
              </li>
            </ul>

            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
                'bg-whatsapp text-sm font-semibold text-white shadow-md',
                'transition-colors hover:bg-whatsapp-hover hover:text-white'
              )}
            >
              <WhatsAppIcon className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
          <p className="text-center md:text-left">&copy; 2026 SheQueen. All rights reserved.</p>
          <nav
            aria-label="Legal"
            className="mt-5 grid w-full grid-cols-2 gap-x-3 gap-y-3 md:mt-0 md:flex md:w-auto md:flex-wrap md:justify-end md:gap-x-6 md:gap-y-2"
          >
            <Link
              href="/privacy"
              className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-center text-[13px] transition hover:border-primary/25 hover:text-foreground md:border-0 md:bg-transparent md:p-0 md:text-left md:text-sm"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-center text-[13px] transition hover:border-primary/25 hover:text-foreground md:border-0 md:bg-transparent md:p-0 md:text-left md:text-sm"
            >
              Terms of Service
            </Link>
            <Link
              href="/refunds"
              className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-center text-[13px] transition hover:border-primary/25 hover:text-foreground md:border-0 md:bg-transparent md:p-0 md:text-left md:text-sm"
            >
              Refund Policy
            </Link>
            <Link
              href="/cookies"
              className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-center text-[13px] transition hover:border-primary/25 hover:text-foreground md:border-0 md:bg-transparent md:p-0 md:text-left md:text-sm"
            >
              Cookie Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
