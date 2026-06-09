import type { Metadata } from 'next';
import { SharedCheckoutPayPage } from '@/components/checkout/shared-checkout-pay-page';
import { getSharedCheckoutById } from '@/lib/firebase/shared-checkouts-server';
import { getRecipientFirstName, resolveSharedCheckoutStatus } from '@/lib/shared-checkout-utils';
import { BRAND_NAME } from '@/lib/brand';
import { formatUGX } from '@/lib/wholesale-data';

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const checkout = await getSharedCheckoutById(token);

  if (!checkout || resolveSharedCheckoutStatus(checkout) === 'expired') {
    return {
      title: 'Payment link unavailable',
      description: `This SheQueen payment link is no longer available.`,
    };
  }

  const firstName = getRecipientFirstName(checkout.recipientName);
  const title = `Pay for ${firstName}'s order`;
  const description = `Help ${firstName} complete their ${formatUGX(checkout.total)} SheQueen order.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${BRAND_NAME}`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${BRAND_NAME}`,
      description,
    },
  };
}

export default async function SharedCheckoutPayRoute({ params }: PageProps) {
  const { token } = await params;
  return <SharedCheckoutPayPage token={token} />;
}
