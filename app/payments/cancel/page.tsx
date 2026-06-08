'use client';

import { Suspense } from 'react';
import { PaymentResultPage } from '@/components/payments/payment-result-page';

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={null}>
      <PaymentResultPage variant="cancel" />
    </Suspense>
  );
}
