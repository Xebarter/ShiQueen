import { noIndexMetadata } from '@/lib/seo/site';

export const metadata = noIndexMetadata(
  'Booking confirmation',
  'Your ShiQueen service booking confirmation.',
  '/services/booking-confirmation'
);

export default function BookingConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
