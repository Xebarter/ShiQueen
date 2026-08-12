import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CookiePolicyPage } from '@/components/legal/cookie-policy-page';

export const metadata: Metadata = {
  title: 'Cookie Policy | SheQueen',
  description:
    'Learn how SheQueen uses cookies and similar technologies on our website, and how you can manage your preferences.',
};

export default function Cookies() {
  return (
    <main className="min-h-screen overflow-x-clip bg-gradient-to-b from-muted/25 via-background to-background">
      <Header />
      <CookiePolicyPage />
      <Footer />
    </main>
  );
}
