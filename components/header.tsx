'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { SearchBar } from './search-bar';
import { BrandLogo } from './brand-logo';

export function Header() {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <BrandLogo variant="header" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/shop"
              className="text-sm font-medium text-foreground hover:text-primary transition"
            >
              Shop
            </Link>
            <Link
              href="/collections"
              className="text-sm font-medium text-foreground hover:text-primary transition"
            >
              Collections
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-foreground hover:text-primary transition"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-foreground hover:text-primary transition"
            >
              Contact
            </Link>
            <Link
              href="/loyalty"
              className="text-sm font-medium text-foreground hover:text-primary transition"
            >
              Rewards
            </Link>
            <Link
              href="/wholesale"
              className="text-sm font-medium text-foreground hover:text-primary transition"
            >
              Wholesale
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:block mx-4">
            <SearchBar />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {user && (
              <Link href="/account" className="p-2 hover:bg-secondary rounded-lg transition">
                <User className="w-5 h-5 text-foreground" />
              </Link>
            )}
            {!user && (
              <Link href="/sign-in" className="text-sm font-medium text-foreground hover:text-primary transition">
                Sign In
              </Link>
            )}
            <Link
              href="/cart"
              className="relative p-2 hover:bg-secondary rounded-lg transition"
            >
              <ShoppingBag className="w-5 h-5 text-foreground" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-secondary rounded-lg transition"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link
              href="/shop"
              className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded transition"
            >
              Shop
            </Link>
            <Link
              href="/collections"
              className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded transition"
            >
              Collections
            </Link>
            <Link
              href="/about"
              className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded transition"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded transition"
            >
              Contact
            </Link>
            <Link
              href="/loyalty"
              className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded transition"
            >
              Rewards
            </Link>
            <Link
              href="/wholesale"
              className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded transition"
            >
              Wholesale
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
