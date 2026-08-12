import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PrivacyPolicyPage } from '@/components/legal/privacy-policy-page';

export const metadata: Metadata = {
  title: 'Privacy Policy | SheQueen',
  description:
    'Learn how SheQueen collects, uses, shares, and protects your personal information when you shop or use our services.',
};

export default function Privacy() {
  return (
    <main className="min-h-screen overflow-x-clip bg-gradient-to-b from-muted/25 via-background to-background">
      <Header />
      <PrivacyPolicyPage />
      <Footer />
    </main>
  );
}
