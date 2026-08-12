import { SharedBookingPayPage } from '@/components/services/shared-booking-pay-page';

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  return {
    title: 'Pay for a SheQueen booking',
    description: `Secure gift payment link for a SheQueen service booking.`,
    robots: token ? undefined : { index: false },
  };
}

export default async function SharedBookingPayRoute({ params }: PageProps) {
  const { token } = await params;
  return <SharedBookingPayPage token={token} />;
}
