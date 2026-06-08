'use client';

import { Suspense } from 'react';
import { PaymentResultPage } from '@/components/payments/payment-result-page';

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={null}>
      <PaymentResultPage variant="failure" />
    </Suspense>
  );
}
