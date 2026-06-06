import { Suspense } from 'react';
import OrderConfirmationContent from './order-confirmation-content';

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading confirmation...</p>
        </main>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
