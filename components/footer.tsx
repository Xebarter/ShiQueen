import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { BrandLogo } from './brand-logo';

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <BrandLogo variant="footer" className="mb-4" />
            <p className="text-sm text-muted-foreground">
              Curated collections for the modern, sophisticated woman.
            </p>
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
                <Link href="/collections" className="hover:text-foreground transition">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/shop?new=true" className="hover:text-foreground transition">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/shop?sale=true" className="hover:text-foreground transition">
                  Sale
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
                <Mail className="w-4 h-4" />
                <a href="mailto:hello@shequeen.com" className="hover:text-foreground transition">
                  hello@shequeen.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+1234567890" className="hover:text-foreground transition">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>New York, NY 10001</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; 2026 SheQueen. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-foreground transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-foreground transition">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
