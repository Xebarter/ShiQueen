import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TermsOfServicePage } from '@/components/legal/terms-of-service-page';

export const metadata: Metadata = {
  title: 'Terms of Service | ShiQueen',
  description:
    'Read the ShiQueen Terms of Service covering orders, payments, shipping, returns, and your use of our online store.',
};

export default function Terms() {
  return (
    <main className="min-h-screen overflow-x-clip bg-gradient-to-b from-muted/25 via-background to-background">
      <Header />
      <TermsOfServicePage />
      <Footer />
    </main>
  );
}
