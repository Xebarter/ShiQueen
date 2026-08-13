import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CookiePolicyPage } from '@/components/legal/cookie-policy-page';
import { PAGE_SEO } from '@/lib/seo/site';

export const metadata: Metadata = PAGE_SEO.cookies;

export default function Cookies() {
  return (
    <main className="min-h-screen overflow-x-clip bg-gradient-to-b from-muted/25 via-background to-background">
      <Header />
      <CookiePolicyPage />
      <Footer />
    </main>
  );
}
