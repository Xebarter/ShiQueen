'use client';

import { Suspense } from 'react';
import { PaymentResultPage } from '@/components/payments/payment-result-page';

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={null}>
      <PaymentResultPage variant="pending" />
    </Suspense>
  );
}
