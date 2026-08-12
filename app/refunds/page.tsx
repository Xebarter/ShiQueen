import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { RefundPolicyPage } from '@/components/legal/refund-policy-page';

export const metadata: Metadata = {
  title: 'Refund Policy | SheQueen',
  description:
    'Learn how SheQueen handles returns, refunds, exchanges, and order cancellations for your purchases.',
};

export default function Refunds() {
  return (
    <main className="min-h-screen overflow-x-clip bg-gradient-to-b from-muted/25 via-background to-background">
      <Header />
      <RefundPolicyPage />
      <Footer />
    </main>
  );
}
